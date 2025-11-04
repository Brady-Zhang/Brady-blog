using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevHabit.Api.Migrations.Application;

/// <inheritdoc />
public partial class AddBlogThumbnailFields : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "thumbnail_summary",
            schema: "dev_habit",
            table: "blogs",
            type: "character varying(300)",
            maxLength: 300,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "thumbnail_title",
            schema: "dev_habit",
            table: "blogs",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "thumbnail_summary",
            schema: "dev_habit",
            table: "blogs");

        migrationBuilder.DropColumn(
            name: "thumbnail_title",
            schema: "dev_habit",
            table: "blogs");
    }
}
