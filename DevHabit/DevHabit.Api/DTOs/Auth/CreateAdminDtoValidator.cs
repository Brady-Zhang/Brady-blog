using FluentValidation;

namespace DevHabit.Api.DTOs.Auth;

public sealed class CreateAdminDtoValidator : AbstractValidator<CreateAdminDto>
{
    public CreateAdminDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(100);

        RuleFor(x => x.Secret)
            .NotEmpty()
            .WithMessage("Admin creation secret is required");

        RuleFor(x => x.Name)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.Name));
    }
}

