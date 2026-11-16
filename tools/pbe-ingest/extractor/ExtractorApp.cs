using CUE4Parse.UE4.Assets;
using CUE4Parse.UE4.Assets.Exports.Engine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace PbeIngest;

public static class ExtractorApp
{
    private static readonly JsonSerializerSettings JsonSettings = new()
    {
        ContractResolver = new CamelCasePropertyNamesContractResolver(),
        NullValueHandling = NullValueHandling.Ignore,
        Formatting = Formatting.Indented,
    };

    public static int Run(string[] args)
    {
        ExtractOptions options;
        try
        {
            options = ExtractOptions.Parse(args);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"extract: {ex.Message}");
            ExtractOptions.PrintHelp();
            return 1;
        }

        if (options.Help)
        {
            ExtractOptions.PrintHelp();
            return 0;
        }

        ObjectTypeRegistry.RegisterClass("TFTDataTable", typeof(UDataTable));

        MountedPaks mounted;
        try
        {
            mounted = PbeProvider.Mount(options.PaksDir, options.MappingsPath);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"extract: unable to mount Paks: {ex.Message}");
            return 1;
        }

        Directory.CreateDirectory(options.OutDir);

        var assets = Inventory.Scan(mounted.Provider.Files.Values);
        var tables = assets.Where(a => a.IsDataTable).OrderBy(a => a.Path).ToList();
        var strings = assets.Where(a => a.IsStringTable).OrderBy(a => a.Path).ToList();
        var scopedTables = tables.Where(a => Inventory.InScope(a, options)).ToList();

        Log(options, $"[extract] mounted {mounted.Provider.Files.Count} files across {mounted.Readers} reader(s)");
        Log(options, $"[extract] inventory: {tables.Count} data table(s), {strings.Count} string table(s)");
        if (mounted.MappingError is not null)
            Log(options, $"[extract] mappings error: {mounted.MappingError}");

        var manifest = BuildManifest(options, mounted, tables, strings, scopedTables);

        if (options.Mode != "inventory")
            RunExports(options, mounted, scopedTables, strings, manifest);

        var finalPath = Path.Combine(options.OutDir, "manifest.json");
        File.WriteAllText(finalPath, manifest.ToString(Formatting.Indented));
        Log(options, $"[extract] manifest: {finalPath}");

        if (options.Mode != "inventory" && scopedTables.Count > 0 && !mounted.MappingsProvided)
        {
            Log(options, "[extract] DataTable rows skipped: supply --mappings <TFT.usmap|TFT.jmap> (PKG_UnversionedProperties)");
            return 2;
        }

        return 0;
    }

    private static JObject BuildManifest(
        ExtractOptions options,
        MountedPaks mounted,
        List<AssetInfo> tables,
        List<AssetInfo> strings,
        List<AssetInfo> scopedTables)
    {
        var setGroups = tables
            .GroupBy(a => a.SetId?.ToString() ?? "shared")
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                set = g.Key,
                dataTables = g.Count(),
                champions = g.Count(a => a.Category == "champions"),
                traits = g.Count(a => a.Category == "traits"),
                items = g.Count(a => a.Category == "items"),
                augments = g.Count(a => a.Category == "augments"),
            })
            .ToList();

        return new JObject
        {
            ["schemaVersion"] = 1,
            ["generatedAt"] = DateTimeOffset.UtcNow.ToString("O"),
            ["paksDir"] = options.PaksDir,
            ["outDir"] = options.OutDir,
            ["mode"] = options.Mode,
            ["scope"] = options.Scope,
            ["setFilter"] = options.SetId,
            ["match"] = options.Match,
            ["readers"] = mounted.Readers,
            ["fileCount"] = mounted.Provider.Files.Count,
            ["build"] = ToJToken(Inventory.ReadBuildVersion(options.PaksDir)),
            ["mappings"] = new JObject
            {
                ["provided"] = mounted.MappingsProvided,
                ["path"] = options.MappingsPath,
                ["error"] = mounted.MappingError,
            },
            ["counts"] = new JObject
            {
                ["dataTables"] = tables.Count,
                ["dataTablesInScope"] = scopedTables.Count,
                ["stringTables"] = strings.Count,
            },
            ["sets"] = ToJToken(setGroups),
            ["containers"] = ToJToken(ContainerStats(options.PaksDir)),
            ["dataTables"] = ToJToken(tables),
            ["stringTables"] = ToJToken(strings),
        };
    }

    private static void RunExports(
        ExtractOptions options,
        MountedPaks mounted,
        List<AssetInfo> tables,
        List<AssetInfo> strings,
        JObject manifest)
    {
        var stringResults = new List<StringTableExportResult>();
        foreach (var asset in strings)
        {
            if (options.SetId is { } setId && asset.SetId is { } assetSet && assetSet != setId)
                continue;
            if (!string.IsNullOrWhiteSpace(options.Match) &&
                !asset.Path.Contains(options.Match, StringComparison.OrdinalIgnoreCase))
                continue;

            var result = StringTableExporter.Export(mounted.Provider, asset, options.OutDir);
            stringResults.Add(result);
            if (result.Status == "exported")
                Log(options, $"[extract] stringtable {result.EntryCount,5} entries  {asset.Path}");
            else
                Log(options, $"[extract] stringtable {result.Status}: {asset.Path} ({result.Error})");
        }

        var tableResults = new List<TableExportResult>();
        if (!mounted.MappingsProvided)
        {
            tableResults.AddRange(tables.Select(table => new TableExportResult(
                table.Path,
                null,
                "skipped",
                0,
                "Mappings required for DataTable rows (PKG_UnversionedProperties)")));
        }
        else
        {
            foreach (var asset in tables)
            {
                var result = TableExporter.Export(mounted.Provider, asset, options.OutDir);
                tableResults.Add(result);
                if (result.Status == "exported")
                    Log(options, $"[extract] table {result.RowCount,5} rows  {asset.Path}");
                else if (result.Status == "error")
                    Log(options, $"[extract] table error: {asset.Path} ({result.Error})");
            }
        }

        var index = new JObject
        {
            ["dataTables"] = ToJToken(tableResults),
            ["stringTables"] = ToJToken(stringResults),
        };
        File.WriteAllText(Path.Combine(options.OutDir, "exports.json"), index.ToString(Formatting.Indented));

        manifest["exports"] = new JObject
        {
            ["dataTables"] = ToJToken(tableResults),
            ["stringTables"] = ToJToken(stringResults),
            ["summary"] = new JObject
            {
                ["dataTables"] = Summary(tableResults.Select(r => r.Status)),
                ["stringTables"] = Summary(stringResults.Select(r => r.Status)),
            },
        };
    }

    private static JObject Summary(IEnumerable<string> statuses)
    {
        var list = statuses.ToList();
        return new JObject
        {
            ["total"] = list.Count,
            ["exported"] = list.Count(s => s == "exported"),
            ["skipped"] = list.Count(s => s == "skipped"),
            ["error"] = list.Count(s => s == "error"),
        };
    }

    private static List<object> ContainerStats(string paksDir)
    {
        return Directory.GetFiles(paksDir)
            .Where(p => p.EndsWith(".utoc", StringComparison.OrdinalIgnoreCase) ||
                        p.EndsWith(".ucas", StringComparison.OrdinalIgnoreCase) ||
                        p.EndsWith(".pak", StringComparison.OrdinalIgnoreCase))
            .OrderBy(p => p)
            .Select(p =>
            {
                var info = new FileInfo(p);
                return (object)new
                {
                    name = info.Name,
                    bytes = info.Length,
                    lastWriteUtc = info.LastWriteTimeUtc.ToString("O"),
                };
            })
            .ToList();
    }

    private static JToken? ToJToken(object? value)
    {
        if (value is null) return null;
        return JToken.Parse(JsonConvert.SerializeObject(value, JsonSettings));
    }

    private static void Log(ExtractOptions options, string message)
    {
        if (!options.Quiet) Console.WriteLine(message);
    }
}
