using System.Net.Mime;
using Asp.Versioning;
using DevHabit.Api.DTOs.Common;
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

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromQuery] string? blogId = null)
    {
        if (file is null || file.Length == 0)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "File is required");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"Unsupported content type: {file.ContentType}");
        }

        string extension = Path.GetExtension(file.FileName);
        string userId = User.GetIdentityId() ?? "anonymous";
        string safeBlogId = string.IsNullOrWhiteSpace(blogId) ? "general" : blogId.Trim();
        string blobName = $"users/{userId}/blogs/{safeBlogId}/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid():N}{extension}";

        await using Stream s = file.OpenReadStream();
        string container = storageOptions.Value.ContainerName;
        string url = await blobStorage.UploadAsync(s, container, blobName, file.ContentType, HttpContext.RequestAborted);

        return Ok(new { url, blobName, contentType = file.ContentType, size = file.Length });
    }
}


