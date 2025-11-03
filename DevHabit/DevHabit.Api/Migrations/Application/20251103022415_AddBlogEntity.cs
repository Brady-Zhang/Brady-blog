using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevHabit.Api.Migrations.Application;

/// <inheritdoc />
public partial class AddBlogEntity : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "blogs",
            schema: "dev_habit",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: false),
                title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                content = table.Column<string>(type: "character varying(100000)", maxLength: 100000, nullable: false),
                is_published = table.Column<bool>(type: "boolean", nullable: false),
                is_archived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                published_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_blogs", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "BlogTags",
            schema: "dev_habit",
            columns: table => new
            {
                blog_id = table.Column<string>(type: "text", nullable: false),
                tag_id = table.Column<string>(type: "character varying(500)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_blog_tags", x => new { x.blog_id, x.tag_id });
                table.ForeignKey(
                    name: "fk_blog_tags_blogs_blog_id",
                    column: x => x.blog_id,
                    principalSchema: "dev_habit",
                    principalTable: "blogs",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "fk_blog_tags_tags_tag_id",
                    column: x => x.tag_id,
                    principalSchema: "dev_habit",
                    principalTable: "tags",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "ix_blogs_created_at_utc",
            schema: "dev_habit",
            table: "blogs",
            column: "created_at_utc");

        migrationBuilder.CreateIndex(
            name: "ix_blogs_is_published",
            schema: "dev_habit",
            table: "blogs",
            column: "is_published");

        migrationBuilder.CreateIndex(
            name: "ix_blogs_user_id",
            schema: "dev_habit",
            table: "blogs",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "ix_blog_tags_tag_id",
            schema: "dev_habit",
            table: "BlogTags",
            column: "tag_id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "BlogTags",
            schema: "dev_habit");

        migrationBuilder.DropTable(
            name: "blogs",
            schema: "dev_habit");
    }
}
