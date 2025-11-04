using DevHabit.Api.DTOs.Common;

namespace DevHabit.Api.DTOs.Blogs;

public sealed class BlogWithTagsDto : ILinksResponse
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? ThumbnailTitle { get; set; }
    public string? ThumbnailSummary { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public bool IsArchived { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public List<string> Tags { get; set; } = [];
    public List<LinkDto> Links { get; set; } = [];
}

