using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace DevHabit.Api.Settings;

public sealed class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        try
        {
            var formFileParameters = context.MethodInfo.GetParameters()
                .Where(p => p.ParameterType == typeof(IFormFile) || p.ParameterType == typeof(IFormFile[]))
                .ToList();

            if (!formFileParameters.Any())
            {
                return;
            }

            // Remove existing parameters that are IFormFile
            var parametersToRemove = operation.Parameters
                .Where(p => formFileParameters.Any(fp => string.Equals(fp.Name, p.Name, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            foreach (var param in parametersToRemove)
            {
                operation.Parameters.Remove(param);
            }

            // Initialize RequestBody
            operation.RequestBody ??= new OpenApiRequestBody
            {
                Required = true
            };

            operation.RequestBody.Content ??= new Dictionary<string, OpenApiMediaType>();

            if (!operation.RequestBody.Content.TryGetValue("multipart/form-data", out var mediaType))
            {
                mediaType = new OpenApiMediaType();
            }

            mediaType.Schema ??= new OpenApiSchema
            {
                Type = "object",
                Properties = new Dictionary<string, OpenApiSchema>()
            };

            mediaType.Schema.Properties ??= new Dictionary<string, OpenApiSchema>();
            mediaType.Schema.Required ??= new HashSet<string>();

            // Add file parameters to schema
            foreach (var formFileParam in formFileParameters)
            {
                if (formFileParam.ParameterType == typeof(IFormFile))
                {
                    var paramName = formFileParam.Name ?? "file";
                    mediaType.Schema.Properties[paramName] = new OpenApiSchema
                    {
                        Type = "string",
                        Format = "binary",
                        Description = "File to upload"
                    };
                    
                    // Check if parameter is required (not nullable and no default value)
                    if (!IsNullableParameter(formFileParam) && !formFileParam.HasDefaultValue)
                    {
                        mediaType.Schema.Required.Add(paramName);
                    }
                }
            }

            operation.RequestBody.Content["multipart/form-data"] = mediaType;

            // Handle query parameters that are not IFormFile
            var queryParameters = context.MethodInfo.GetParameters()
                .Where(p => p.GetCustomAttributes(typeof(FromQueryAttribute), false).Any() &&
                           p.ParameterType != typeof(IFormFile) &&
                           p.ParameterType != typeof(IFormFile[]))
                .ToList();

            foreach (var queryParam in queryParameters)
            {
                var existingParam = operation.Parameters.FirstOrDefault(p => 
                    string.Equals(p.Name, queryParam.Name, StringComparison.OrdinalIgnoreCase));
                
                if (existingParam == null)
                {
                    operation.Parameters.Add(new OpenApiParameter
                    {
                        Name = queryParam.Name,
                        In = ParameterLocation.Query,
                        Required = !queryParam.HasDefaultValue,
                        Schema = new OpenApiSchema
                        {
                            Type = GetOpenApiType(queryParam.ParameterType),
                            Nullable = queryParam.HasDefaultValue || IsNullableType(queryParam.ParameterType)
                        }
                    });
                }
            }
        }
        catch
        {
            // If there's any error, skip this filter to avoid breaking Swagger generation
            // This allows Swagger to fall back to default behavior
        }
    }

    private static bool IsNullableParameter(System.Reflection.ParameterInfo parameter)
    {
        return IsNullableType(parameter.ParameterType);
    }

    private static string GetOpenApiType(Type type)
    {
        if (type == typeof(string))
        {
            return "string";
        }
        
        if (type == typeof(int) || type == typeof(long))
        {
            return "integer";
        }
        
        if (type == typeof(bool))
        {
            return "boolean";
        }
        
        if (type == typeof(double) || type == typeof(float) || type == typeof(decimal))
        {
            return "number";
        }
        
        if (IsNullableType(type))
        {
            return GetOpenApiType(Nullable.GetUnderlyingType(type)!);
        }
        
        return "string";
    }

    private static bool IsNullableType(Type type)
    {
        return type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Nullable<>);
    }
}

