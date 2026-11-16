using System.Text.Json;
using System.Text.RegularExpressions;

namespace PbeIngest;

public sealed class AssetInfo
{
    public required string Path { get; init; }
    public required long Size { get; init; }
    public required string Name { get; init; }
    public int? SetId { get; init; }
    public required string Category { get; init; }
    public bool IsDataTable { get; init; }
    public bool IsStringTable { get; init; }
}

public static class Inventory
{
    private static readonly Regex SetPattern = new(@"GameFeatures/Set_(\d+)/", RegexOptions.Compiled);

    public static List<AssetInfo> Scan(IEnumerable<CUE4Parse.FileProvider.Objects.GameFile> files)
    {
        var result = new List<AssetInfo>();
        foreach (var file in files)
        {
            var path = file.Path;
            if (!path.StartsWith("TFT/", StringComparison.Ordinal) || !path.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase))
                continue;

            var name = Path.GetFileName(path);
            var isDataTable = IsDataTablePath(path, name);
            var isStringTable = IsStringTablePath(path, name);
            if (!isDataTable && !isStringTable)
                continue;

            result.Add(new AssetInfo
            {
                Path = path,
                Size = file.Size,
                Name = name,
                SetId = ParseSet(path),
                Category = CategoryFor(path, name),
                IsDataTable = isDataTable,
                IsStringTable = isStringTable,
            });
        }

        return result;
    }

    public static int? ParseSet(string path)
    {
        var match = SetPattern.Match(path);
        return match.Success && int.TryParse(match.Groups[1].Value, out var setId) ? setId : null;
    }

    private static bool IsDataTablePath(string path, string name)
    {
        if (path.Contains("/DataTables/", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/SharedDataTables/", StringComparison.OrdinalIgnoreCase))
            return true;

        return name.StartsWith("DT_", StringComparison.OrdinalIgnoreCase) &&
               path.Contains("/GameFeatures/", StringComparison.OrdinalIgnoreCase) &&
               (path.Contains("/Set_", StringComparison.OrdinalIgnoreCase) ||
                path.Contains("/Augment_Shared/", StringComparison.OrdinalIgnoreCase) ||
                path.Contains("/Item_Shared/", StringComparison.OrdinalIgnoreCase) ||
                path.Contains("/Carousel_", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsStringTablePath(string path, string name)
    {
        return name.StartsWith("ST_", StringComparison.OrdinalIgnoreCase) ||
               path.Contains("StringTable", StringComparison.OrdinalIgnoreCase) ||
               path.Contains("/Localization/", StringComparison.OrdinalIgnoreCase) ||
               path.Contains("/I18N/", StringComparison.OrdinalIgnoreCase);
    }

    private static string CategoryFor(string path, string name)
    {
        var haystack = name + " " + path;
        if (haystack.Contains("Champion", StringComparison.OrdinalIgnoreCase)) return "champions";
        if (haystack.Contains("Trait", StringComparison.OrdinalIgnoreCase)) return "traits";
        if (haystack.Contains("Augment", StringComparison.OrdinalIgnoreCase)) return "augments";
        if (haystack.Contains("Item", StringComparison.OrdinalIgnoreCase)) return "items";
        return "other";
    }

    public static bool InScope(AssetInfo asset, ExtractOptions options)
    {
        if (options.SetId is { } setId && asset.SetId is { } assetSet && assetSet != setId)
            return false;

        if (!string.IsNullOrWhiteSpace(options.Match) &&
            !asset.Path.Contains(options.Match, StringComparison.OrdinalIgnoreCase))
            return false;

        if (options.Scope == "all")
            return true;

        return asset.SetId is not null ||
               asset.Path.Contains("/GameFeatures/Set_Shared/", StringComparison.OrdinalIgnoreCase) ||
               asset.Path.Contains("/Augment_Shared/Content/_Distribution/", StringComparison.OrdinalIgnoreCase) ||
               asset.Path.Contains("/Item_Shared/Content/DataTables/", StringComparison.OrdinalIgnoreCase);
    }

    public static object? ReadBuildVersion(string paksDir)
    {
        var path = Path.GetFullPath(Path.Combine(paksDir, "..", "..", "..", "Engine", "Build", "Build.version"));
        if (!File.Exists(path)) return null;

        using var doc = JsonDocument.Parse(File.ReadAllText(path));
        var root = doc.RootElement;
        return new
        {
            path,
            majorVersion = root.TryGetProperty("MajorVersion", out var major) ? major.GetInt32() : (int?)null,
            minorVersion = root.TryGetProperty("MinorVersion", out var minor) ? minor.GetInt32() : (int?)null,
            patchVersion = root.TryGetProperty("PatchVersion", out var patch) ? patch.GetInt32() : (int?)null,
            changelist = root.TryGetProperty("Changelist", out var changelist) ? changelist.GetInt64() : (long?)null,
            branchName = root.TryGetProperty("BranchName", out var branch) ? branch.GetString() : null,
            buildVersion = root.TryGetProperty("BuildVersion", out var build) ? build.GetString() : null,
        };
    }
}
