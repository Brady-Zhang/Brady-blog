using FluentValidation;

namespace DevHabit.Api.DTOs.Blogs;

public sealed class UpdateBlogDtoValidator : AbstractValidator<UpdateBlogDto>
{
    public UpdateBlogDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(200);

        RuleFor(x => x.Summary)
            .MaximumLength(500)
            .When(x => x.Summary is not null);

        RuleFor(x => x.Content)
            .NotEmpty()
            .MaximumLength(100000); // Max ~100KB for content
    }
}

