using System.Linq.Expressions;
using DevHabit.Api.Entities;

namespace DevHabit.Api.DTOs.Blogs;

public static class BlogQueries
{
    public static Expression<Func<Blog, BlogDto>> ProjectToDto()
    {
        return blog => new BlogDto
        {
            Id = blog.Id,
            Title = blog.Title,
            Summary = blog.Summary,
            Content = blog.Content,
            IsPublished = blog.IsPublished,
            IsArchived = blog.IsArchived,
            PublishedAtUtc = blog.PublishedAtUtc,
            CreatedAtUtc = blog.CreatedAtUtc,
            UpdatedAtUtc = blog.UpdatedAtUtc
        };
    }

    public static Expression<Func<Blog, BlogWithTagsDto>> ProjectToDtoWithTags()
    {
        return blog => new BlogWithTagsDto
        {
            Id = blog.Id,
            Title = blog.Title,
            Summary = blog.Summary,
            Content = blog.Content,
            IsPublished = blog.IsPublished,
            IsArchived = blog.IsArchived,
            PublishedAtUtc = blog.PublishedAtUtc,
            CreatedAtUtc = blog.CreatedAtUtc,
            UpdatedAtUtc = blog.UpdatedAtUtc,
            Tags = blog.Tags.Select(t => t.Name).ToList()
        };
    }
}

