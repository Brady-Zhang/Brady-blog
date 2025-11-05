namespace DevHabit.Api.Settings;

public sealed class PublicBlogOptions
{
    public const string SectionName = "PublicBlog";

    /// <summary>
    /// The UserId whose published blogs should be displayed on the public blog page.
    /// If not set, all published blogs from all users will be shown.
    /// </summary>
    public string? OwnerUserId { get; set; }
}

