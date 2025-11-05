using Microsoft.AspNetCore.Http;

namespace DevHabit.Api.DTOs.Uploads;

public sealed record UploadImageRequestDto
{
    public required IFormFile File { get; init; }
    public string? BlogId { get; init; }
}

