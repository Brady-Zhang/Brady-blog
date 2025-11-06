namespace DevHabit.Api.Entities;

public sealed class Blog
{
    public string Id { get; set; }
    public string UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? ThumbnailTitle { get; set; }
    public string? ThumbnailSummary { get; set; }
    public string Content { get; set; } = string.Empty; // Tiptap JSON content
    public string? ContentHtml { get; set; } // Server-generated, sanitized HTML cache
    public bool IsPublished { get; set; }
    public bool IsArchived { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public List<BlogTag> BlogTags { get; set; }
    public List<Tag> Tags { get; set; }

    public static string NewId() => $"b_{Guid.CreateVersion7()}";
}

