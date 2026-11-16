using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets.Exports.Engine;
using CUE4Parse.UE4.Assets.Objects;
using CUE4Parse.UE4.Assets.Objects.Properties;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace PbeIngest;

public sealed record TableExportResult(
    string AssetPath,
    string? OutFile,
    string Status,
    int RowCount,
    string? Error);

public static class TableExporter
{
    private static readonly JsonSerializer Serializer = JsonSerializer.Create(new JsonSerializerSettings
    {
        Formatting = Formatting.Indented,
        NullValueHandling = NullValueHandling.Ignore,
        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
        MaxDepth = 64,
    });

    public static TableExportResult Export(IFileProvider provider, AssetInfo asset, string outRoot)
    {
        try
        {
            var pkg = provider.LoadPackage(asset.Path);
            var table = pkg.GetExports().OfType<UDataTable>().FirstOrDefault();
            if (table is null)
            {
                var first = pkg.GetExports().FirstOrDefault();
                return new TableExportResult(asset.Path, null, "skipped", 0,
                    $"Export type '{first?.ExportType ?? "unknown"}' is not a UDataTable");
            }

            if (table.RowMap is null)
            {
                return new TableExportResult(asset.Path, null, "skipped", 0,
                    "Row map unavailable: a matching .usmap/.jmap mapping is required for PKG_UnversionedProperties");
            }

            var rows = new JObject();
            foreach (var (rowName, row) in table.RowMap)
                rows[rowName.Text] = CleanStruct(row, Serializer);

            var root = new JObject
            {
                ["assetPath"] = asset.Path,
                ["exportName"] = table.Name,
                ["exportType"] = table.ExportType,
                ["rowStruct"] = table.RowStructName,
                ["rowCount"] = table.RowMap.Count,
                ["rows"] = rows,
            };

            var outFile = OutputPath(outRoot, "tables", asset.Path);
            Directory.CreateDirectory(Path.GetDirectoryName(outFile)!);
            File.WriteAllText(outFile, root.ToString(Formatting.Indented));

            return new TableExportResult(asset.Path, outFile, "exported", table.RowMap.Count, null);
        }
        catch (Exception ex)
        {
            return new TableExportResult(asset.Path, null, "error", 0, $"{ex.GetType().Name}: {ex.Message}");
        }
    }

    private static JObject CleanStruct(FStructFallback row, JsonSerializer serializer)
    {
        var result = new JObject();
        foreach (var property in row.Properties)
        {
            var name = property.Name.Text;
            var value = ToToken(property, serializer);
            if (result.TryGetValue(name, out var existing))
            {
                if (existing is JArray array) array.Add(value);
                else result[name] = new JArray(existing, value);
            }
            else
            {
                result[name] = value;
            }
        }
        return result;
    }

    private static JToken ToToken(FPropertyTag property, JsonSerializer serializer)
    {
        if (property.Tag is null) return JValue.CreateNull();

        object? value;
        try
        {
            value = property.Tag.GetValue<object>();
        }
        catch
        {
            value = property.Tag;
        }

        return value switch
        {
            null => JValue.CreateNull(),
            FStructFallback nested => CleanStruct(nested, serializer),
            FPropertyTagType tag => JToken.FromObject(tag, serializer),
            _ => JToken.FromObject(value, serializer),
        };
    }

    internal static string OutputPath(string outRoot, string bucket, string assetPath)
    {
        var relative = assetPath.StartsWith("TFT/", StringComparison.Ordinal) ? assetPath[4..] : assetPath;
        relative = relative.Replace('/', Path.DirectorySeparatorChar);
        return Path.Combine(outRoot, bucket, relative + ".json");
    }
}
