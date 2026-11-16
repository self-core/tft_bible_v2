using CUE4Parse.FileProvider;
using CUE4Parse.MappingsProvider;
using CUE4Parse.MappingsProvider.Jmap;
using CUE4Parse.MappingsProvider.Usmap;
using CUE4Parse.UE4.Versions;

namespace PbeIngest;

public sealed record MountedPaks(DefaultFileProvider Provider, int Readers, bool MappingsProvided, string? MappingError);

public static class PbeProvider
{
    public static MountedPaks Mount(string paksDir, string? mappingsPath)
    {
        if (!Directory.Exists(paksDir))
            throw new DirectoryNotFoundException($"Paks directory not found: {paksDir}");

        ITypeMappingsProvider mappings;
        var provided = false;
        string? mappingError = null;

        if (!string.IsNullOrWhiteSpace(mappingsPath))
        {
            try
            {
                var fullPath = Path.GetFullPath(mappingsPath);
                if (!File.Exists(fullPath))
                    throw new FileNotFoundException("Mappings file not found", fullPath);

                mappings = Path.GetExtension(fullPath).ToLowerInvariant() switch
                {
                    ".jmap" => new JmapTypeMappingsProvider(fullPath),
                    _ => new FileUsmapTypeMappingsProvider(fullPath),
                };

                if (mappings.MappingsForGame is null)
                    throw new InvalidDataException("Mappings file parsed but produced no type mappings");

                provided = true;
            }
            catch (Exception ex)
            {
                mappingError = ex.Message;
                mappings = new PeripheralMappings();
            }
        }
        else
        {
            mappings = new PeripheralMappings();
        }

        var provider = new DefaultFileProvider(
            paksDir,
            SearchOption.TopDirectoryOnly,
            isCaseInsensitive: true,
            new VersionContainer(EGame.GAME_UE5_7))
        {
            MappingsContainer = mappings,
        };

        provider.Initialize();
        var readers = provider.Mount();
        if (readers == 0)
            throw new InvalidOperationException($"No pak/utoc readers mounted from {paksDir}");

        return new MountedPaks(provider, readers, provided, mappingError);
    }
}
