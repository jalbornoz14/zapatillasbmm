<#
  Importa el catalogo de zapatillas desde KicksDB (StockX) UNA sola vez
  y lo deja guardado dentro del sitio:
    js/catalogo.js   -> datos de las zapatillas
    img/             -> fotos descargadas

  Asi la tienda no consulta la API cuando la abren los usuarios.
  Uso normal: doble clic en importar-catalogo.bat

  Opciones (desde PowerShell):
    .\importar-catalogo.ps1 -PorMarca 15 -Marcas Nike,Jordan,adidas -TipoCambio 3.75
#>
param(
  [string[]]$Marcas = @('Nike', 'Jordan', 'adidas', 'New Balance', 'Puma', 'ASICS'),
  [int]$PorMarca = 10,
  [double]$TipoCambio = 3.75,
  [int]$MaxConsultas = 40,
  [string]$BaseUrl = 'https://api.kicks.dev',
  [string]$Clave = $env:KICKS_API_KEY
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$dirImg = Join-Path $raiz 'img'
$dirJs = Join-Path $raiz 'js'
$salida = Join-Path $dirJs 'catalogo.js'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$navegador = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

if (-not $Clave) {
  Write-Host ''
  Write-Host 'Pega tu clave de KicksDB (la encuentras en https://kicks.dev/api-keys).'
  $Clave = Read-Host 'Clave'
}
$Clave = "$Clave".Trim()
if (-not $Clave) { Write-Host 'No se ingreso ninguna clave. No se hizo nada.'; exit 1 }

# Permite -Marcas Nike,Jordan tambien cuando se llama desde el .bat
$Marcas = @($Marcas | ForEach-Object { "$_".Split(',') } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

$script:consultas = 0
$script:cuota = ''

function Get-Api([string]$url) {
  if ($script:consultas -ge $MaxConsultas) { throw "Se alcanzo el tope de $MaxConsultas consultas de esta corrida." }
  $script:consultas++
  $r = Invoke-WebRequest -Uri $url -Headers @{ Authorization = "Bearer $Clave"; Accept = 'application/json' } -UseBasicParsing
  try { $q = $r.Headers['X-Quota-Current']; if ($q) { $script:cuota = "$q" } } catch { }
  # Se decodifica a mano como UTF-8 para no romper tildes en Windows PowerShell 5.1
  $texto = $utf8.GetString($r.RawContentStream.ToArray())
  return ($texto | ConvertFrom-Json)
}

function Get-Codigo($err) {
  try { return [int]$err.Exception.Response.StatusCode } catch { return 0 }
}

# StockX entrega miniaturas por defecto: se pide la foto en tamano grande
function Get-FotoGrande([string]$u) {
  if ($u -notmatch 'images\.stockx\.com') { return $u }
  $base = $u.Split('?')[0]
  return "${base}?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color"
}

function Get-Hash([string]$t) {
  $h = 0
  foreach ($c in $t.ToCharArray()) { $h = ($h * 31 + [int]$c) % 100003 }
  return $h
}

$fondos = @('#FFD3BF', '#CFE3FF', '#D7F0CB', '#F1D4F2', '#FFE9A6', '#C9EEE9', '#E3E5EC', '#D5D9FF', '#F3DCC2', '#FFCFCF')

function Convert-Producto($p) {
  $genero = "$($p.gender)".ToLower()
  if ($genero -match 'child|kid|preschool|toddler|infant|youth|boy|girl') { return $null }
  $g = 'Unisex'
  if ($genero -match 'women') { $g = 'Mujer' } elseif ($genero -match 'men') { $g = 'Hombre' }

  $usd = 0.0
  if ($p.avg_price) { $usd = [double]$p.avg_price }
  if ($usd -le 0 -and $p.min_price) { $usd = [double]$p.min_price }
  if ($usd -le 0) { return $null }

  $imagen = "$($p.image)"
  if (-not $imagen -and $p.gallery) { $imagen = "$(@($p.gallery)[0])" }
  if (-not $imagen) { return $null }
  $imagen = Get-FotoGrande $imagen

  $slug = "$($p.slug)"
  if (-not $slug) { $slug = "$($p.id)" }
  if (-not $slug) { return $null }

  $marca = "$($p.brand)".Trim()
  $nombre = "$($p.primary_title)".Trim()
  $color = "$($p.secondary_title)".Trim()
  if (-not $nombre) { $nombre = "$($p.title)".Trim(); $color = '' }
  # "Nike Dunk Low" -> "Dunk Low", pero "Jordan 1" y "New Balance 550" se quedan completos
  if ($marca -and $nombre.ToLower().StartsWith($marca.ToLower() + ' ')) {
    $resto = $nombre.Substring($marca.Length + 1).Trim()
    if ($resto -match '^[A-Za-z]') { $nombre = $resto }
  }

  $h = Get-Hash $slug
  $soles = [math]::Max(99.9, [math]::Round($usd * $TipoCambio / 10) * 10 - 0.1)
  $precio = $soles
  $oferta = $null
  if ($h % 4 -eq 0) { $precio = [math]::Round($soles * 1.18 / 10) * 10 - 0.1; $oferta = $soles }

  # Stock de ejemplo: la API no conoce el inventario de la tienda
  $desde = 37; $hasta = 43
  if ($g -eq 'Mujer') { $desde = 36; $hasta = 40 } elseif ($g -eq 'Hombre') { $desde = 39; $hasta = 44 }
  $tallas = [ordered]@{}
  foreach ($t in 36..44) {
    $n = 0
    if ($t -ge $desde -and $t -le $hasta) { $n = ($h + $t * 7) % 5 }
    $tallas["$t"] = $n
  }

  return [ordered]@{
    id = $slug; name = $nombre; colorway = $color; brand = $marca; gender = $g
    price = [math]::Round($precio, 2); salePrice = $oferta
    featured = $false; visible = $true
    description = ''; sku = "$($p.sku)"
    sizes = $tallas
    image = $imagen
    art = [ordered]@{ tile = $fondos[$h % $fondos.Count] }
    _orders = [int]$p.weekly_orders
  }
}

Write-Host ''
Write-Host "Importando hasta $PorMarca zapatillas de cada marca: $($Marcas -join ', ')"

$porMarcaListas = @()
$usarLimit = $true
$detener = $false
foreach ($marca in $Marcas) {
  $lista = New-Object System.Collections.ArrayList
  $vistos = @{}
  # Primero con filtro exacto de marca; si no trae nada, con busqueda por nombre
  foreach ($modo in @('filtro', 'busqueda')) {
    if ($lista.Count -gt 0 -or $detener) { break }
    $pagina = 1
    while ($lista.Count -lt $PorMarca -and $pagina -le 3) {
      if ($modo -eq 'filtro') {
        $filtro = 'brand = "{0}" AND product_type = "sneakers"' -f $marca
        $url = "$BaseUrl/v3/stockx/products?filters=$([uri]::EscapeDataString($filtro))&page=$pagina"
      } else {
        $url = "$BaseUrl/v3/stockx/products?query=$([uri]::EscapeDataString($marca))&page=$pagina"
      }
      if ($usarLimit) { $url += "&limit=$([math]::Min(100, $PorMarca * 2))" }
      try {
        $resp = Get-Api $url
      } catch {
        $codigo = Get-Codigo $_
        if ($codigo -eq 401 -or $codigo -eq 403) { Write-Host 'KicksDB rechazo la clave (401/403). Revisa que este bien copiada.'; exit 1 }
        if ($codigo -eq 429) { Write-Host 'KicksDB respondio 429: se agoto la cuota o vas muy rapido. Prueba mas tarde.'; $detener = $true; break }
        if (($codigo -eq 400 -or $codigo -eq 422) -and $usarLimit) { $usarLimit = $false; continue }
        Write-Host "  $marca ($modo): error $codigo - $($_.Exception.Message)"
        break
      }
      $datos = @($resp.data)
      if ($datos.Count -eq 0) { break }
      foreach ($p in $datos) {
        if ($lista.Count -ge $PorMarca) { break }
        if ($modo -eq 'busqueda') {
          if ("$($p.brand)".Trim() -ine $marca) { continue }
          if ("$($p.product_type)" -and "$($p.product_type)" -ine 'sneakers') { continue }
        }
        $prod = Convert-Producto $p
        if ($prod -and -not $vistos.ContainsKey($prod.id)) { $vistos[$prod.id] = 1; [void]$lista.Add($prod) }
      }
      $pagina++
    }
  }
  Write-Host ("  {0,-12} {1} zapatillas" -f $marca, $lista.Count)
  $porMarcaListas += , $lista
}

# Se intercalan las marcas para que el catalogo no salga en bloques
$productos = New-Object System.Collections.ArrayList
for ($i = 0; $i -lt $PorMarca; $i++) {
  foreach ($lista in $porMarcaListas) { if ($i -lt $lista.Count) { [void]$productos.Add($lista[$i]) } }
}

if ($productos.Count -eq 0) {
  Write-Host ''
  Write-Host 'No se obtuvo ninguna zapatilla. No se cambio nada en la tienda.'
  Write-Host "Consultas usadas: $($script:consultas)"
  exit 1
}

# La mas vendida de la semana va en la portada
$top = $productos | Sort-Object { $_._orders } -Descending | Select-Object -First 1
$top.featured = $true
foreach ($p in $productos) { $p.Remove('_orders') }

# Fotos: se copian al sitio para no depender de los servidores de StockX
New-Item -ItemType Directory -Force -Path $dirImg | Out-Null
$fallas = 0; $n = 0
Write-Host ''
Write-Host "Descargando $($productos.Count) fotos..."
foreach ($p in $productos) {
  $n++
  $ext = '.jpg'
  if ($p.image -match 'fm=webp') { $ext = '.webp' } elseif ($p.image -match '\.png') { $ext = '.png' }
  $archivo = ($p.id -replace '[^A-Za-z0-9\-_]', '-') + $ext
  $destino = Join-Path $dirImg $archivo
  try {
    Invoke-WebRequest -Uri $p.image -OutFile $destino -UserAgent $navegador -UseBasicParsing
    if ((Get-Item $destino).Length -lt 1000) { throw 'archivo vacio' }
    $p.image = "img/$archivo"
  } catch {
    $fallas++
    if (Test-Path $destino) { Remove-Item $destino -Force }
  }
}

New-Item -ItemType Directory -Force -Path $dirJs | Out-Null
$json = ConvertTo-Json -InputObject @($productos) -Depth 6
$cabecera = "/* Generado por importar-catalogo el $(Get-Date -Format 'yyyy-MM-dd HH:mm'). Fuente: KicksDB (StockX).`n   Precios convertidos a soles con tipo de cambio $TipoCambio. El stock por talla es de ejemplo. */`n"
[IO.File]::WriteAllText($salida, $cabecera + 'window.BMM_CATALOGO = ' + $json + ";`n", $utf8)

Write-Host ''
Write-Host "Listo: $($productos.Count) zapatillas guardadas en js\catalogo.js"
Write-Host "Consultas usadas en esta corrida: $($script:consultas)"
if ($script:cuota) { Write-Host "Consultas usadas este mes segun KicksDB: $($script:cuota)" }
if ($fallas -gt 0) { Write-Host "Aviso: $fallas fotos no se pudieron descargar y quedaron enlazadas a StockX." }
Write-Host 'Abre index.html para ver la tienda con el catalogo nuevo.'
