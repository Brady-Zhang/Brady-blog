namespace DevHabit.Api.DTOs.Uploads;

public sealed record UploadImageResponseDto
{
    public required string Url { get; init; }
    public required string BlobName { get; init; }
    public required string ContentType { get; init; }
    public required long Size { get; init; }
}

