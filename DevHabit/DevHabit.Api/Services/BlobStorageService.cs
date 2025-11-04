using Azure;
using Azure.Storage;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using DevHabit.Api.Settings;
using Microsoft.Extensions.Options;

namespace DevHabit.Api.Services;

public interface IBlobStorageService
{
    Task<string> UploadAsync(
        Stream content,
        string containerName,
        string blobName,
        string contentType,
        CancellationToken cancellationToken = default);
}

public sealed class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly BlobStorageOptions _options;

    public BlobStorageService(IOptions<BlobStorageOptions> options)
    {
        _options = options.Value;
        if (string.IsNullOrWhiteSpace(_options.ConnectionString))
        {
            throw new InvalidOperationException("Blob storage connection string is not configured.");
        }

        _blobServiceClient = new BlobServiceClient(_options.ConnectionString);
    }

    public async Task<string> UploadAsync(
        Stream content,
        string containerName,
        string blobName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        BlobContainerClient container = _blobServiceClient.GetBlobContainerClient(containerName);
        // Do NOT set PublicAccessType when the storage account forbids public access
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        BlobClient blob = container.GetBlobClient(blobName);

        var headers = new BlobHttpHeaders
        {
            ContentType = contentType
        };

        await blob.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = headers,
            TransferOptions = new StorageTransferOptions
            {
                InitialTransferSize = 256 * 1024,
                MaximumTransferSize = 4 * 1024 * 1024
            }
        }, cancellationToken);

        // Prefer returning a SAS URL so reads work even when public access is disabled
        if (blob.CanGenerateSasUri)
        {
            var sas = new BlobSasBuilder
            {
                BlobContainerName = containerName,
                BlobName = blobName,
                Resource = "b",
                StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(Math.Max(1, _options.SasExpiryMinutes))
            };
            sas.SetPermissions(BlobSasPermissions.Read);
            Uri sasUri = blob.GenerateSasUri(sas);
            return sasUri.ToString();
        }

        // Fallbacks
        if (!string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
        {
            return $"{_options.PublicBaseUrl.TrimEnd('/')}/{containerName}/{Uri.EscapeDataString(blobName)}";
        }

        return blob.Uri.ToString();
    }
}


