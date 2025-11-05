using System.Net.Mime;
using Asp.Versioning;
using DevHabit.Api.DTOs.Uploads;
using DevHabit.Api.Entities;
using DevHabit.Api.Extensions;
using DevHabit.Api.Services;
using DevHabit.Api.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace DevHabit.Api.Controllers;

[Authorize(Roles = Roles.Member)]
[ApiController]
[Route("uploads/images")]
[ApiVersion(1.0)]
[Produces(MediaTypeNames.Application.Json, CustomMediaTypeNames.Application.JsonV1)]
public sealed class UploadsController(IBlobStorageService blobStorage, IOptions<BlobStorageOptions> storageOptions)
    : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml"
    };

    /// <summary>
    /// Uploads an image file to Azure Blob Storage
    /// </summary>
    /// <param name="request">The image upload request containing the file and optional blog ID</param>
    /// <returns>The uploaded image URL and metadata</returns>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    [ProducesResponseType<UploadImageResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload([FromForm] UploadImageRequestDto request)
    {
        if (request.File is null || request.File.Length == 0)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "File is required");
        }

        if (!AllowedContentTypes.Contains(request.File.ContentType))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"Unsupported content type: {request.File.ContentType}");
        }

        string extension = Path.GetExtension(request.File.FileName);
        string userId = User.GetIdentityId() ?? "anonymous";
        string safeBlogId = string.IsNullOrWhiteSpace(request.BlogId) ? "general" : request.BlogId.Trim();
        string blobName = $"users/{userId}/blogs/{safeBlogId}/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid():N}{extension}";

        await using Stream s = request.File.OpenReadStream();
        string container = storageOptions.Value.ContainerName;
        string url = await blobStorage.UploadAsync(s, container, blobName, request.File.ContentType, HttpContext.RequestAborted);

        return Ok(new UploadImageResponseDto
        {
            Url = url,
            BlobName = blobName,
            ContentType = request.File.ContentType,
            Size = request.File.Length
        });
    }
}


