namespace PbeIngest;

public sealed class ExtractOptions
{
    public const string DefaultPaksDir = @"D:\Riot Games\Teamfight Tactics\PBE\TFT\Content\Paks";

    public string PaksDir { get; private init; } = DefaultPaksDir;
    public string OutDir { get; private init; } = Path.Combine(Environment.CurrentDirectory, "data", "pbe_extracted");
    public string Mode { get; private init; } = "all";
    public string Scope { get; private init; } = "set";
    public string? MappingsPath { get; private init; }
    public string? Match { get; private init; }
    public int? SetId { get; private init; }
    public bool Quiet { get; private init; }
    public bool Help { get; private init; }

    public static ExtractOptions Parse(string[] args)
    {
        var paks = Environment.GetEnvironmentVariable("TFT_PBE_PAKS_DIR") ?? DefaultPaksDir;
        var outDir = Environment.GetEnvironmentVariable("TFT_PBE_OUT_DIR")
            ?? Path.Combine(Environment.CurrentDirectory, "data", "pbe_extracted");
        var mappings = Environment.GetEnvironmentVariable("TFT_PBE_MAPPINGS");
        var mode = "all";
        var scope = "set";
        string? match = null;
        int? setId = null;
        var quiet = false;
        var help = false;

        for (var i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--paks":
                    paks = RequireValue(args, ref i);
                    break;
                case "--out":
                    outDir = RequireValue(args, ref i);
                    break;
                case "--mode":
                    mode = RequireValue(args, ref i).ToLowerInvariant();
                    break;
                case "--scope":
                    scope = RequireValue(args, ref i).ToLowerInvariant();
                    break;
                case "--mappings":
                    mappings = RequireValue(args, ref i);
                    break;
                case "--match":
                    match = RequireValue(args, ref i);
                    break;
                case "--set":
                    setId = int.Parse(RequireValue(args, ref i));
                    break;
                case "--inventory":
                case "--list":
                    mode = "inventory";
                    break;
                case "--export":
                    mode = "export";
                    break;
                case "--all":
                    mode = "all";
                    break;
                case "--quiet":
                case "-q":
                    quiet = true;
                    break;
                case "--help":
                case "-h":
                case "/?":
                    help = true;
                    break;
                default:
                    throw new ArgumentException($"Unknown argument: {args[i]}");
            }
        }

        if (mode is not ("inventory" or "export" or "all"))
            throw new ArgumentException("--mode must be inventory, export, or all");
        if (scope is not ("set" or "all"))
            throw new ArgumentException("--scope must be set or all");

        return new ExtractOptions
        {
            PaksDir = Path.GetFullPath(paks),
            OutDir = Path.GetFullPath(outDir),
            Mode = mode,
            Scope = scope,
            MappingsPath = mappings,
            Match = match,
            SetId = setId,
            Quiet = quiet,
            Help = help,
        };
    }

    private static string RequireValue(string[] args, ref int i)
    {
        if (i + 1 >= args.Length) throw new ArgumentException($"Missing value for {args[i]}");
        return args[++i];
    }

    public static void PrintHelp()
    {
        Console.WriteLine("""
            TFT PBE pak extractor (CUE4Parse)

            Usage:
              extractor [options]

            Options:
              --paks <dir>        Paks directory (env TFT_PBE_PAKS_DIR)
              --out <dir>         Output directory (env TFT_PBE_OUT_DIR)
              --mode <mode>       inventory | export | all (default: all)
              --scope <scope>     set | all (default: set)
              --mappings <file>   .usmap or .jmap mappings (env TFT_PBE_MAPPINGS)
              --match <text>      Only assets whose path contains this text
              --set <id>          Restrict set tables to this set id
              --inventory, --list Alias for --mode inventory
              --export            Alias for --mode export
              --all               Alias for --mode all
              --quiet, -q         Reduce console output
              --help, -h          Show this help

            Notes:
              TFT packages use PKG_UnversionedProperties. DataTable rows can only be
              decoded when a matching .usmap/.jmap mappings file is supplied.
              Inventory and StringTable export work without mappings.
            """);
    }
}
