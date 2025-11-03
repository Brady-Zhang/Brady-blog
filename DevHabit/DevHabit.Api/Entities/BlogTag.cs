namespace DevHabit.Api.Entities;

public sealed class BlogTag
{
    public string BlogId { get; set; }
    public string TagId { get; set; }

    public Blog Blog { get; set; }
    public Tag Tag { get; set; }
}

