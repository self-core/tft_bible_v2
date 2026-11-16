using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets.Exports.Internationalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace PbeIngest;

public sealed record StringTableExportResult(
    string AssetPath,
    string? OutFile,
    string Status,
    int EntryCount,
    string? Error);

public static class StringTableExporter
{
    public static StringTableExportResult Export(IFileProvider provider, AssetInfo asset, string outRoot)
    {
        try
        {
            var pkg = provider.LoadPackage(asset.Path);
            var table = pkg.GetExports().OfType<UStringTable>().FirstOrDefault();
            if (table is null)
            {
                var first = pkg.GetExports().FirstOrDefault();
                return new StringTableExportResult(asset.Path, null, "skipped", 0,
                    $"Export type '{first?.ExportType ?? "unknown"}' is not a UStringTable");
            }

            var root = new JObject
            {
                ["assetPath"] = asset.Path,
                ["namespace"] = table.StringTable.TableNamespace,
                ["entryCount"] = table.StringTable.KeysToEntries.Count,
                ["entries"] = JObject.FromObject(table.StringTable.KeysToEntries),
            };

            if (table.StringTable.KeysToMetaData is { Count: > 0 } metadata)
                root["metadata"] = JObject.FromObject(metadata);

            var outFile = TableExporter.OutputPath(outRoot, "strings", asset.Path);
            Directory.CreateDirectory(Path.GetDirectoryName(outFile)!);
            File.WriteAllText(outFile, root.ToString(Formatting.Indented));

            return new StringTableExportResult(asset.Path, outFile, "exported", table.StringTable.KeysToEntries.Count, null);
        }
        catch (Exception ex)
        {
            return new StringTableExportResult(asset.Path, null, "error", 0, $"{ex.GetType().Name}: {ex.Message}");
        }
    }
}
