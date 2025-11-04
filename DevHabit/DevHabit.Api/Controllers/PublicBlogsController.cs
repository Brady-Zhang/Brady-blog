using System.Net.Mime;
using Asp.Versioning;
using DevHabit.Api.Database;
using DevHabit.Api.DTOs.Blogs;
using DevHabit.Api.DTOs.Common;
using DevHabit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevHabit.Api.Controllers;

/// <summary>
/// Public Blog Controller - Allows anonymous access to published blogs
/// </summary>
[AllowAnonymous]
[ApiController]
[Route("public/blogs")]
[ApiVersion(1.0)]
[Produces(
    MediaTypeNames.Application.Json,
    "application/vnd.dev-habit.json+json",
    "application/vnd.dev-habit.hateoas+json")]
public sealed class PublicBlogsController(
    ApplicationDbContext dbContext) : ControllerBase
{
    private static readonly char[] WordSeparators = { ' ' };
    /// <summary>
    /// Retrieves a paginated list of published blogs (public access)
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PaginationResult<BlogDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicBlogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        search = search?.Trim().ToLower();

        // Only get published blogs from all users
        IQueryable<Blog> blogsQuery = dbContext
            .Blogs
            .Where(b => b.IsPublished); // Only published blogs

        // Apply search filter if provided
        if (!string.IsNullOrEmpty(search))
        {
            blogsQuery = blogsQuery.Where(b =>
                b.Title.ToLower().Contains(search) ||
                b.Summary != null && b.Summary.ToLower().Contains(search) ||
                b.Content.ToLower().Contains(search));
        }

        int totalCount = await blogsQuery.CountAsync();

        List<Blog> allBlogs = await blogsQuery.ToListAsync();

        // Calculate relevance scores if search is provided
        List<(BlogDto dto, double score)> blogsWithScores = new List<(BlogDto, double)>();
        
        if (!string.IsNullOrEmpty(search))
        {
            foreach (var blog in allBlogs)
            {
                double relevance = CalculateRelevance(blog, search);
                var dto = MapBlogToDto(blog);
                dto.Relevance = relevance;
                blogsWithScores.Add((dto, relevance));
            }
            
            // Sort by relevance descending, then by published date
            blogsWithScores = blogsWithScores
                .OrderByDescending(x => x.score)
                .ThenByDescending(x => x.dto.PublishedAtUtc ?? x.dto.CreatedAtUtc)
                .ToList();
        }
        else
        {
            // No search - just order by published date
            foreach (var blog in allBlogs)
            {
                var dto = MapBlogToDto(blog);
                blogsWithScores.Add((dto, 0));
            }
            
            blogsWithScores = blogsWithScores
                .OrderByDescending(x => x.dto.PublishedAtUtc ?? x.dto.CreatedAtUtc)
                .ToList();
        }

        // Pagination
        var paginatedBlogs = blogsWithScores
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.dto)
            .ToList();

        var paginationResult = new PaginationResult<BlogDto>
        {
            Items = paginatedBlogs,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Links = []
        };

        return Ok(paginationResult);
    }

    /// <summary>
    /// Retrieves a specific published blog by ID (public access)
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType<BlogWithTagsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublicBlog(string id)
    {
        // Only get published blogs
        BlogWithTagsDto? blog = await dbContext
            .Blogs
            .Where(b => b.Id == id && b.IsPublished)
            .Select(BlogQueries.ProjectToDtoWithTags())
            .FirstOrDefaultAsync();

        if (blog is null)
        {
            return NotFound();
        }

        return Ok(blog);
    }

    /// <summary>
    /// Calculates relevance score for a blog based on search query
    /// </summary>
    private static double CalculateRelevance(Blog blog, string searchQuery)
    {
        double score = 0;
        string lowerSearch = searchQuery.ToLower();
        string lowerTitle = blog.Title.ToLower();
        string lowerSummary = blog.Summary?.ToLower() ?? string.Empty;
        string lowerContent = blog.Content.ToLower();

        // Title exact match: 100 points
        if (lowerTitle == lowerSearch)
        {
            score += 100;
        }
        else if (lowerTitle.Contains(lowerSearch))
        {
            // Title contains search: 50 points + bonus for earlier position
            score += 50;
            int position = lowerTitle.IndexOf(lowerSearch, StringComparison.Ordinal);
            score += (100 - position) * 0.5;
        }

        // Count word matches in title
        var searchWords = lowerSearch.Split(WordSeparators, StringSplitOptions.RemoveEmptyEntries);
        foreach (var word in searchWords)
        {
            if (lowerTitle.Contains(word))
            {
                score += 30;
            }
        }

        // Summary matches: 20 points per occurrence
        if (!string.IsNullOrEmpty(blog.Summary) && lowerSummary.Contains(lowerSearch))
        {
            score += 20;
        }

        // Count word matches in summary
        foreach (var word in searchWords)
        {
            if (lowerSummary.Contains(word))
            {
                score += 10;
            }
        }

        // Content matches: 10 points per occurrence (capped at 50)
        int contentMatches = CountOccurrences(lowerContent, lowerSearch);
        score += Math.Min(contentMatches * 10, 50);

        // Count word matches in content (capped)
        int totalWordMatchesInContent = 0;
        foreach (var word in searchWords)
        {
            totalWordMatchesInContent += CountOccurrences(lowerContent, word);
        }
        score += Math.Min(totalWordMatchesInContent * 2, 30);

        return Math.Round(score, 2);
    }

    private static int CountOccurrences(string text, string pattern)
    {
        int count = 0;
        int index = 0;
        while ((index = text.IndexOf(pattern, index, StringComparison.Ordinal)) != -1)
        {
            count++;
            index += pattern.Length;
        }
        return count;
    }

    /// <summary>
    /// Maps Blog entity to BlogDto
    /// </summary>
          private static BlogDto MapBlogToDto(Blog blog)
      {
          return new BlogDto
          {
              Id = blog.Id,
              Title = blog.Title,
              Summary = blog.Summary,
              ThumbnailTitle = blog.ThumbnailTitle,
              ThumbnailSummary = blog.ThumbnailSummary,
              Content = blog.Content,
              IsPublished = blog.IsPublished,
              IsArchived = blog.IsArchived,
              PublishedAtUtc = blog.PublishedAtUtc,
              CreatedAtUtc = blog.CreatedAtUtc,
              UpdatedAtUtc = blog.UpdatedAtUtc,
              Links = []
          };
      }
}

