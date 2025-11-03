using DevHabit.Api.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace DevHabit.Api.DTOs.Blogs;

public sealed record BlogsQueryParameters : AcceptHeaderDto
{
    [FromQuery(Name = "q")]
    public string? Search { get; set; }
    public bool? IsPublished { get; init; }
    public string? Sort { get; init; }
    public string? Fields { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}
