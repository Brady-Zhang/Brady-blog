using DevHabit.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevHabit.Api.Database.Configurations;

public sealed class BlogConfiguration : IEntityTypeConfiguration<Blog>
{
    public void Configure(EntityTypeBuilder<Blog> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id).HasMaxLength(500);
        builder.Property(b => b.UserId).HasMaxLength(500);
        
        builder.Property(b => b.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.Summary)
            .HasMaxLength(500);

        builder.Property(b => b.Content)
            .IsRequired()
            .HasMaxLength(100000);

        builder.Property(b => b.IsPublished)
            .IsRequired();

        builder.Property(b => b.IsArchived)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(b => b.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(b => b.UserId);
        builder.HasIndex(b => b.IsPublished);
        builder.HasIndex(b => b.CreatedAtUtc);

        builder
            .HasMany(b => b.Tags)
            .WithMany()
            .UsingEntity<BlogTag>(
                j => j
                    .HasOne(bt => bt.Tag)
                    .WithMany()
                    .HasForeignKey(bt => bt.TagId),
                j => j
                    .HasOne(bt => bt.Blog)
                    .WithMany(b => b.BlogTags)
                    .HasForeignKey(bt => bt.BlogId),
                j =>
                {
                    j.HasKey(bt => new { bt.BlogId, bt.TagId });
                    j.ToTable("BlogTags");
                    j.Property(bt => bt.BlogId).HasMaxLength(500);
                    j.Property(bt => bt.TagId).HasMaxLength(500);
                });
    }
}

