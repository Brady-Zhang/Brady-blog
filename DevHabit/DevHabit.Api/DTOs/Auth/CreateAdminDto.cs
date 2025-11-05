namespace DevHabit.Api.DTOs.Auth;

public sealed record CreateAdminDto
{
    public required string Email { get; init; }
    public string? Name { get; init; }
    public required string Password { get; init; }
    public required string Secret { get; init; }
}

