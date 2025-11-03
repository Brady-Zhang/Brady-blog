using Asp.Versioning;
using DevHabit.Api.Database;
using DevHabit.Api.DTOs.BlogTags;
using DevHabit.Api.Entities;
using DevHabit.Api.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevHabit.Api.Controllers;

[Authorize(Roles = Roles.Member)]
[ApiController]
[Route("blogs/{blogId}/tags")]
[ApiVersion(1.0)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class BlogTagsController(ApplicationDbContext dbContext, UserContext userContext) : ControllerBase
{
    public const string Name = "BlogTags";

    /// <summary>
    /// Upserts tags for a blog
    /// </summary>
    [HttpPut(Name = Name)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpsertBlogTags(
        string blogId,
        UpsertBlogTagsDto upsertBlogTagsDto,
        IValidator<UpsertBlogTagsDto> validator)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        await validator.ValidateAndThrowAsync(upsertBlogTagsDto);

        Blog? blog = await dbContext
            .Blogs
            .Include(b => b.BlogTags)
            .FirstOrDefaultAsync(b => b.Id == blogId && b.UserId == userId);

        if (blog is null)
        {
            return NotFound();
        }

        // Remove existing tags that are not in the new list
        var tagsToRemove = blog.BlogTags
            .Where(bt => !upsertBlogTagsDto.TagIds.Contains(bt.TagId))
            .ToList();

        foreach (BlogTag blogTag in tagsToRemove)
        {
            blog.BlogTags.Remove(blogTag);
        }

        // Add new tags
            foreach (string tagId in upsertBlogTagsDto.TagIds)
            {
                if (!blog.BlogTags.Any(bt => bt.TagId == tagId))
                {
                    var tag = await dbContext.Tags.FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId);
                    if (tag is null)
                {
                    return Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        detail: $"Tag with id '{tagId}' not found");
                }

                blog.BlogTags.Add(new BlogTag { BlogId = blogId, TagId = tagId });
            }
        }

        await dbContext.SaveChangesAsync();

        return NoContent();
    }
}

