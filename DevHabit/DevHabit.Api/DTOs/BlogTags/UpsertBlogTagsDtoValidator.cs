using FluentValidation;

namespace DevHabit.Api.DTOs.BlogTags;

public sealed class UpsertBlogTagsDtoValidator : AbstractValidator<UpsertBlogTagsDto>
{
    public UpsertBlogTagsDtoValidator()
    {
        RuleFor(x => x.TagIds)
            .NotNull()
            .Must(x => x.Count <= 10)
            .WithMessage("A blog can have at most 10 tags");
    }
}

