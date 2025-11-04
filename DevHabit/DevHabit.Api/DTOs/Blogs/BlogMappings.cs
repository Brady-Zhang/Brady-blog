using DevHabit.Api.Entities;
using DevHabit.Api.Services.Sorting;

namespace DevHabit.Api.DTOs.Blogs;

public static class BlogMappings
{
    public static readonly SortMappingDefinition<BlogDto, Blog> SortMapping = new()
    {
        Mappings =
        [
            new SortMapping(nameof(BlogDto.Title), nameof(Blog.Title)),
            new SortMapping(nameof(BlogDto.Summary), nameof(Blog.Summary)),
            new SortMapping(nameof(BlogDto.IsPublished), nameof(Blog.IsPublished)),
            new SortMapping(nameof(BlogDto.PublishedAtUtc), nameof(Blog.PublishedAtUtc)),
            new SortMapping(nameof(BlogDto.CreatedAtUtc), nameof(Blog.CreatedAtUtc)),
            new SortMapping(nameof(BlogDto.UpdatedAtUtc), nameof(Blog.UpdatedAtUtc))
        ]
    };

    public static Blog ToEntity(this CreateBlogDto dto, string userId)
    {
        return new Blog
        {
            Id = Blog.NewId(),
            UserId = userId,
            Title = dto.Title,
            Summary = dto.Summary,
            ThumbnailTitle = dto.ThumbnailTitle,
            ThumbnailSummary = dto.ThumbnailSummary,
            Content = dto.Content,
            IsPublished = dto.IsPublished,
            PublishedAtUtc = dto.IsPublished ? DateTime.UtcNow : null,
            CreatedAtUtc = DateTime.UtcNow,
            BlogTags = [],
            Tags = []
        };
    }

    public static BlogDto ToDto(this Blog blog)
    {
        return new BlogDto
        {
            Id = blog.Id,
            Title = blog.Title,
            Summary = blog.Summary,
            ThumbnailTitle = blog.ThumbnailTitle,
            ThumbnailSummary = blog.ThumbnailSummary,
            Content = blog.Content,
            IsPublished = blog.IsPublished,
            IsArchived = blog.IsArchived,
            PublishedAtUtc = blog.PublishedAtUtc,
            CreatedAtUtc = blog.CreatedAtUtc,
            UpdatedAtUtc = blog.UpdatedAtUtc
        };
    }

    public static void UpdateFromDto(this Blog blog, UpdateBlogDto dto)
    {
        blog.Title = dto.Title;
        blog.Summary = dto.Summary;
        blog.ThumbnailTitle = dto.ThumbnailTitle;
        blog.ThumbnailSummary = dto.ThumbnailSummary;
        blog.Content = dto.Content;
        
        // If blog is being published for the first time
        if (dto.IsPublished && !blog.IsPublished)
        {
            blog.PublishedAtUtc = DateTime.UtcNow;
        }
        // If blog is being unpublished
        else if (!dto.IsPublished && blog.IsPublished)
        {
            blog.PublishedAtUtc = null;
        }
        
        blog.IsPublished = dto.IsPublished;
        blog.UpdatedAtUtc = DateTime.UtcNow;
    }
}

