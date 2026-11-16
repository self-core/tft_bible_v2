using CUE4Parse.MappingsProvider;

namespace PbeIngest;

/// <summary>
/// Allows packages to be opened (and StringTables to be read) when no usmap is available.
/// DataTable rows still require real mappings.
/// </summary>
public sealed class PeripheralMappings : ITypeMappingsProvider
{
    public TypeMappings MappingsForGame { get; } = new();
    public void Load(string path, StringComparer? comparer = null) { }
    public void Load(byte[] bytes, StringComparer? comparer = null) { }
    public void Reload() { }
}
