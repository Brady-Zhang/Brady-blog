using System.Net.Mime;
using DevHabit.Api.Database;
using DevHabit.Api.DTOs.Auth;
using DevHabit.Api.DTOs.Users;
using DevHabit.Api.Entities;
using DevHabit.Api.Services;
using DevHabit.Api.Settings;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Options;

namespace DevHabit.Api.Controllers;

[ApiController]
[Route("auth")]
[AllowAnonymous]
[Produces(
    MediaTypeNames.Application.Json,
    CustomMediaTypeNames.Application.JsonV1,
    CustomMediaTypeNames.Application.HateoasJson,
    CustomMediaTypeNames.Application.HateoasJsonV1)]
public sealed class AuthController(
    UserManager<IdentityUser> userManager,
    ApplicationIdentityDbContext identityDbContext,
    ApplicationDbContext applicationDbContext,
    TokenProvider tokenProvider,
    IOptions<JwtAuthOptions> options) : ControllerBase
{
    private readonly JwtAuthOptions _jwtAuthOptions = options.Value;

    /// <summary>
    /// Registers a new user account
    /// </summary>
    /// <param name="registerUserDto">The registration details</param>
    /// <param name="validator">Validator for the registration request</param>
    /// <returns>Access tokens for the newly registered user</returns>
    [HttpPost("register")]
    [ProducesResponseType<AccessTokensDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AccessTokensDto>> Register(
        RegisterUserDto registerUserDto,
        IValidator<RegisterUserDto> validator)
    {
        await validator.ValidateAndThrowAsync(registerUserDto);

        using IDbContextTransaction transaction = await identityDbContext.Database.BeginTransactionAsync();
        applicationDbContext.Database.SetDbConnection(identityDbContext.Database.GetDbConnection());
        await applicationDbContext.Database.UseTransactionAsync(transaction.GetDbTransaction());

        var identityUser = new IdentityUser
        {
            Email = registerUserDto.Email,
            UserName = registerUserDto.Email
        };

        IdentityResult createUserResult = await userManager.CreateAsync(identityUser, registerUserDto.Password);

        if (!createUserResult.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                {
                    "errors",
                    createUserResult.Errors.ToDictionary(e => e.Code, e => e.Description)
                }
            };
            return Problem(
                detail: "Unable to register user, please try again",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        IdentityResult addToRoleResult = await userManager.AddToRoleAsync(identityUser, Roles.Member);

        if (!addToRoleResult.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                {
                    "errors",
                    addToRoleResult.Errors.ToDictionary(e => e.Code, e => e.Description)
                }
            };
            return Problem(
                detail: "Unable to register user, please try again",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        User user = registerUserDto.ToEntity();
        user.IdentityId = identityUser.Id;

        applicationDbContext.Users.Add(user);

        await applicationDbContext.SaveChangesAsync();

        var tokenRequest = new TokenRequest(identityUser.Id, identityUser.Email, [Roles.Member]);
        AccessTokensDto accessTokens = tokenProvider.Create(tokenRequest);

        var refreshToken = new RefreshToken
        {
            Id = Guid.CreateVersion7(),
            UserId = identityUser.Id,
            Token = accessTokens.RefreshToken,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtAuthOptions.RefreshTokenExpirationDays)
        };
        identityDbContext.RefreshTokens.Add(refreshToken);

        await identityDbContext.SaveChangesAsync();

        await transaction.CommitAsync();

        return Ok(accessTokens);
    }

    /// <summary>
    /// Authenticates a user and returns access tokens
    /// </summary>
    /// <param name="loginUserDto">The login credentials</param>
    /// <param name="validator">Validator for the login request</param>
    /// <returns>Access tokens for the authenticated user</returns>
    [HttpPost("login")]
    [ProducesResponseType<AccessTokensDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AccessTokensDto>> Login(
        LoginUserDto loginUserDto,
        IValidator<LoginUserDto> validator)
    {
        await validator.ValidateAndThrowAsync(loginUserDto);

        IdentityUser? identityUser = await userManager.FindByEmailAsync(loginUserDto.Email);

        if (identityUser is null || !await userManager.CheckPasswordAsync(identityUser, loginUserDto.Password))
        {
            return Unauthorized();
        }

        IList<string> roles = await userManager.GetRolesAsync(identityUser);

        var tokenRequest = new TokenRequest(identityUser.Id, identityUser.Email!, roles);
        AccessTokensDto accessTokens = tokenProvider.Create(tokenRequest);

        var refreshToken = new RefreshToken
        {
            Id = Guid.CreateVersion7(),
            UserId = identityUser.Id,
            Token = accessTokens.RefreshToken,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtAuthOptions.RefreshTokenExpirationDays)
        };
        identityDbContext.RefreshTokens.Add(refreshToken);

        await identityDbContext.SaveChangesAsync();

        return Ok(accessTokens);
    }

    /// <summary>
    /// Refreshes the access token using a refresh token
    /// </summary>
    /// <param name="refreshTokenDto">The refresh token</param>
    /// <param name="validator">Validator for the refresh token request</param>
    /// <returns>New access tokens</returns>
    [HttpPost("refresh")]
    [ProducesResponseType<AccessTokensDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AccessTokensDto>> Refresh(
        RefreshTokenDto refreshTokenDto,
        IValidator<RefreshTokenDto> validator)
    {
        await validator.ValidateAndThrowAsync(refreshTokenDto);

        RefreshToken? refreshToken = await identityDbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshTokenDto.RefreshToken);

        if (refreshToken is null)
        {
            return Unauthorized();
        }

        if (refreshToken.ExpiresAtUtc < DateTime.UtcNow)
        {
            return Unauthorized();
        }

        IList<string> roles = await userManager.GetRolesAsync(refreshToken.User);

        var tokenRequest = new TokenRequest(refreshToken.User.Id, refreshToken.User.Email!, roles);
        AccessTokensDto accessTokens = tokenProvider.Create(tokenRequest);

        refreshToken.Token = accessTokens.RefreshToken;
        refreshToken.ExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtAuthOptions.RefreshTokenExpirationDays);

        await identityDbContext.SaveChangesAsync();

        return Ok(accessTokens);
    }

    /// <summary>
    /// Creates an admin user account (requires admin creation secret)
    /// </summary>
    /// <param name="createAdminDto">Admin account details</param>
    /// <param name="validator">Validator for the admin creation request</param>
    /// <returns>Access tokens for the newly created admin</returns>
    [HttpPost("create-admin")]
    [ProducesResponseType<AccessTokensDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AccessTokensDto>> CreateAdmin(
        CreateAdminDto createAdminDto,
        IValidator<CreateAdminDto> validator)
    {
        await validator.ValidateAndThrowAsync(createAdminDto);

        // Check admin creation secret (configured in appsettings)
        string? adminSecret = _jwtAuthOptions.AdminCreationSecret;
        if (string.IsNullOrWhiteSpace(adminSecret) || createAdminDto.Secret != adminSecret)
        {
            return Problem(
                detail: "Invalid admin creation secret",
                statusCode: StatusCodes.Status403Forbidden);
        }

        using IDbContextTransaction transaction = await identityDbContext.Database.BeginTransactionAsync();
        applicationDbContext.Database.SetDbConnection(identityDbContext.Database.GetDbConnection());
        await applicationDbContext.Database.UseTransactionAsync(transaction.GetDbTransaction());

        // Check if user already exists
        IdentityUser? existingUser = await userManager.FindByEmailAsync(createAdminDto.Email);
        if (existingUser != null)
        {
            // User exists, just add Admin role if not already present
            IList<string> existingRoles = await userManager.GetRolesAsync(existingUser);
            if (!existingRoles.Contains(Roles.Admin))
            {
                await userManager.AddToRoleAsync(existingUser, Roles.Admin);
            }
            // Also ensure Member role
            if (!existingRoles.Contains(Roles.Member))
            {
                await userManager.AddToRoleAsync(existingUser, Roles.Member);
            }

            await identityDbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            IList<string> allRoles = await userManager.GetRolesAsync(existingUser);
            var tokenRequest = new TokenRequest(existingUser.Id, existingUser.Email!, allRoles);
            AccessTokensDto accessTokens = tokenProvider.Create(tokenRequest);

            return Ok(accessTokens);
        }

        // Create new admin user
        var identityUser = new IdentityUser
        {
            Email = createAdminDto.Email,
            UserName = createAdminDto.Email
        };

        IdentityResult createUserResult = await userManager.CreateAsync(identityUser, createAdminDto.Password);

        if (!createUserResult.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                {
                    "errors",
                    createUserResult.Errors.ToDictionary(e => e.Code, e => e.Description)
                }
            };
            return Problem(
                detail: "Unable to create admin user, please try again",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        // Add both Member and Admin roles
        await userManager.AddToRoleAsync(identityUser, Roles.Member);
        await userManager.AddToRoleAsync(identityUser, Roles.Admin);

        var user = new User
        {
            Id = Entities.User.NewId(),
            Email = createAdminDto.Email,
            Name = createAdminDto.Name ?? createAdminDto.Email.Split('@')[0],
            IdentityId = identityUser.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        applicationDbContext.Users.Add(user);
        await applicationDbContext.SaveChangesAsync();

        IList<string> roles = await userManager.GetRolesAsync(identityUser);
        var adminTokenRequest = new TokenRequest(identityUser.Id, identityUser.Email!, roles);
        AccessTokensDto adminAccessTokens = tokenProvider.Create(adminTokenRequest);

        var refreshToken = new RefreshToken
        {
            Id = Guid.CreateVersion7(),
            UserId = identityUser.Id,
            Token = adminAccessTokens.RefreshToken,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtAuthOptions.RefreshTokenExpirationDays)
        };
        identityDbContext.RefreshTokens.Add(refreshToken);

        await identityDbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(adminAccessTokens);
    }
}
