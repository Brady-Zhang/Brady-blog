using System.Dynamic;
using System.Net.Mime;
using Asp.Versioning;
using DevHabit.Api.Database;
using DevHabit.Api.DTOs.Common;
using DevHabit.Api.DTOs.Blogs;
using DevHabit.Api.Entities;
using DevHabit.Api.Services;
using DevHabit.Api.Services.Sorting;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevHabit.Api.Controllers;

[Authorize(Roles = Roles.Member + "," + Roles.Admin)]
[ApiController]
[Route("blogs")]
[ApiVersion(1.0)]
[Produces(
    MediaTypeNames.Application.Json,
    CustomMediaTypeNames.Application.JsonV1,
    CustomMediaTypeNames.Application.HateoasJson,
    CustomMediaTypeNames.Application.HateoasJsonV1)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class BlogsController(
    ApplicationDbContext dbContext,
    LinkService linkService,
    UserContext userContext) : ControllerBase
{
    /// <summary>
    /// Retrieves a paginated list of blogs
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PaginationResult<BlogDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetBlogs(
        [FromQuery] BlogsQueryParameters query,
        SortMappingProvider sortMappingProvider,
        DataShapingService dataShapingService)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!sortMappingProvider.ValidateMappings<BlogDto, Blog>(query.Sort))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"The provided sort parameter isn't valid: '{query.Sort}'");
        }

        if (!dataShapingService.Validate<BlogDto>(query.Fields))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"The provided data shaping fields aren't valid: '{query.Fields}'");
        }

        query.Search ??= query.Search?.Trim().ToLower();

        SortMapping[] sortMappings = sortMappingProvider.GetMappings<BlogDto, Blog>();

        IQueryable<BlogDto> blogsQuery = dbContext
            .Blogs
            .Where(b => b.UserId == userId)
            .Where(b => query.Search == null ||
                        b.Title.ToLower().Contains(query.Search) ||
                        b.Summary != null && b.Summary.ToLower().Contains(query.Search))
            .Where(b => query.IsPublished == null || b.IsPublished == query.IsPublished)
            .ApplySort(query.Sort, sortMappings)
            .Select(BlogQueries.ProjectToDto());

        int totalCount = await blogsQuery.CountAsync();

        List<BlogDto> blogs = await blogsQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var paginationResult = new PaginationResult<ExpandoObject>
        {
            Items = dataShapingService.ShapeCollectionData(
                blogs,
                query.Fields,
                query.IncludeLinks ? b => CreateLinksForBlog(b.Id, query.Fields) : null),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
        if (query.IncludeLinks)
        {
            paginationResult.Links = CreateLinksForBlogs(
                query,
                paginationResult.HasNextPage,
                paginationResult.HasPreviousPage);
        }

        return Ok(paginationResult);
    }

    /// <summary>
    /// Retrieves a specific blog by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType<BlogDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBlog(
        string id,
        [FromQuery] BlogQueryParameters query,
        DataShapingService dataShapingService)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!dataShapingService.Validate<BlogWithTagsDto>(query.Fields))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"The provided data shaping fields aren't valid: '{query.Fields}'");
        }

        BlogWithTagsDto? blog = await dbContext
            .Blogs
            .Where(b => b.Id == id && b.UserId == userId)
            .Select(BlogQueries.ProjectToDtoWithTags())
            .FirstOrDefaultAsync();

        if (blog is null)
        {
            return NotFound();
        }

        ExpandoObject shapedBlogDto = dataShapingService.ShapeData(blog, query.Fields);

        if (query.IncludeLinks)
        {
            ((IDictionary<string, object?>)shapedBlogDto)[nameof(ILinksResponse.Links)] =
                CreateLinksForBlog(id, query.Fields);
        }

        return Ok(shapedBlogDto);
    }

    /// <summary>
    /// Creates a new blog
    /// </summary>
    [HttpPost]
    [ProducesResponseType<BlogDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BlogDto>> CreateBlog(
        CreateBlogDto createBlogDto,
        [FromHeader] AcceptHeaderDto acceptHeader,
        IValidator<CreateBlogDto> validator)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        await validator.ValidateAndThrowAsync(createBlogDto);

        Blog blog = createBlogDto.ToEntity(userId);

        dbContext.Blogs.Add(blog);

        await dbContext.SaveChangesAsync();

        BlogDto blogDto = blog.ToDto();

        if (acceptHeader.IncludeLinks)
        {
            blogDto.Links = CreateLinksForBlog(blog.Id, null);
        }

        return CreatedAtAction(nameof(GetBlog), new { id = blogDto.Id }, blogDto);
    }

    /// <summary>
    /// Updates an existing blog
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateBlog(string id, UpdateBlogDto updateBlogDto)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        Blog? blog = await dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (blog is null)
        {
            return NotFound();
        }

        blog.UpdateFromDto(updateBlogDto);

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Partially updates an existing blog using JSON Patch
    /// </summary>
    [HttpPatch("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> PatchBlog(string id, JsonPatchDocument<BlogDto> patchDocument)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        Blog? blog = await dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (blog is null)
        {
            return NotFound();
        }

        BlogDto blogDto = blog.ToDto();

        patchDocument.ApplyTo(blogDto, ModelState);

        if (!TryValidateModel(blogDto))
        {
            return ValidationProblem(ModelState);
        }

        blog.Title = blogDto.Title;
        blog.Summary = blogDto.Summary;
        blog.Content = blogDto.Content;
        blog.IsPublished = blogDto.IsPublished;
        blog.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Deletes a blog
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteBlog(string id)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        Blog? blog = await dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (blog is null)
        {
            return NotFound();
        }

        dbContext.Blogs.Remove(blog);

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private List<LinkDto> CreateLinksForBlogs(
        BlogsQueryParameters parameters,
        bool hasNextPage,
        bool hasPreviousPage)
    {
        List<LinkDto> links =
        [
            linkService.Create(nameof(GetBlogs), "self", HttpMethods.Get, new
            {
                page = parameters.Page,
                pageSize = parameters.PageSize,
                fields = parameters.Fields,
                q = parameters.Search,
                sort = parameters.Sort,
                isPublished = parameters.IsPublished
            }),
            linkService.Create(nameof(CreateBlog), "create", HttpMethods.Post)
        ];

        if (hasNextPage)
        {
            links.Add(linkService.Create(nameof(GetBlogs), "next-page", HttpMethods.Get, new
            {
                page = parameters.Page + 1,
                pageSize = parameters.PageSize,
                fields = parameters.Fields,
                q = parameters.Search,
                sort = parameters.Sort,
                isPublished = parameters.IsPublished
            }));
        }

        if (hasPreviousPage)
        {
            links.Add(linkService.Create(nameof(GetBlogs), "previous-page", HttpMethods.Get, new
            {
                page = parameters.Page - 1,
                pageSize = parameters.PageSize,
                fields = parameters.Fields,
                q = parameters.Search,
                sort = parameters.Sort,
                isPublished = parameters.IsPublished
            }));
        }

        return links;
    }

    private List<LinkDto> CreateLinksForBlog(string id, string? fields)
    {
        List<LinkDto> links =
        [
            linkService.Create(nameof(GetBlog), "self", HttpMethods.Get, new { id, fields }),
            linkService.Create(nameof(UpdateBlog), "update", HttpMethods.Put, new { id }),
            linkService.Create(nameof(PatchBlog), "partial-update", HttpMethods.Patch, new { id }),
            linkService.Create(nameof(DeleteBlog), "delete", HttpMethods.Delete, new { id }),
            linkService.Create(
                nameof(BlogTagsController.UpsertBlogTags),
                "upsert-tags",
                HttpMethods.Put,
                new { blogId = id },
                BlogTagsController.Name)
        ];

        return links;
    }
}

