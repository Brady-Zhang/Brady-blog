namespace DevHabit.Api.Settings;

public sealed class BlobStorageOptions
{
    public const string SectionName = "Azure:BlobStorage";

    public string? ConnectionString { get; set; }
    public string ContainerName { get; set; } = "blog-images";
    public string? PublicBaseUrl { get; set; } // optional CDN or static endpoint override
    public int SasExpiryMinutes { get; set; } = 60 * 24 * 7; // default 7 days
}


