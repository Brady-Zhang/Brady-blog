using DevHabit.Api.DTOs.Common;

namespace DevHabit.Api.DTOs.Blogs;

public sealed record BlogQueryParameters : AcceptHeaderDto
{
    public string? Fields { get; init; }
}
