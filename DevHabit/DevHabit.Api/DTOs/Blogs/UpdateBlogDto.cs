using System.Text.Json.Serialization;

namespace DevHabit.Api.DTOs.Blogs;

public sealed class UpdateBlogDto
{
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? ThumbnailTitle { get; set; }
    public string? ThumbnailSummary { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ContentHtml { get; set; }
    
    [JsonRequired]
    public bool IsPublished { get; set; }
}

