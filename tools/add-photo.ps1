<#
    add-photo.ps1

    Sizes a photo for the Overview album and prints the markup to
    paste into index.html.

        .\tools\add-photo.ps1 -In "C:\path\to\cat.jpg" -Name "mochi" -Caption "Mochi, unemployed"

    A raw phone photo is 3-5 MB and several thousand pixels wide.
    The album frame is never wider than about 560 CSS pixels, so a
    longest edge of 1200 covers it at 2x on a retina screen and
    nothing above that buys anything a visitor can see.

    Any shape is fine. The album letterboxes the photo over a
    blurred copy of itself, so portrait and landscape both sit in
    the frame without being cropped. A very tall phone photo
    (9:16) ends up narrow, though, so -Crop lets you take a less
    extreme slice first:

        -Crop 0,350,1126,1501     # x,y,width,height in source pixels

    Decoding goes through WIC, not GDI+. System.Drawing handles
    only BMP/GIF/JPEG/PNG/TIFF, and a phone photo saved as .webp
    or .heic would fail on it with a bogus "out of memory".
#>

param(
    [Parameter(Mandatory = $true)][string]$In,
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$Caption = "",
    [int[]]$Crop,
    [int]$MaxEdge = 1200,
    [int]$Quality = 80
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName PresentationCore, WindowsBase, PresentationFramework

if (-not (Test-Path -LiteralPath $In)) {
    Write-Error "No such file: $In"
    exit 1
}
if ($Crop -and $Crop.Count -ne 4) {
    Write-Error "-Crop needs four numbers: x,y,width,height"
    exit 1
}

# images/ sits next to tools/
$repo = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $repo "images"
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$slug = ($Name -replace '[^a-zA-Z0-9\-_]', '-').ToLower().Trim('-')
$dst = Join-Path $outDir "$slug.jpg"

$stream = [System.IO.File]::OpenRead((Resolve-Path -LiteralPath $In))
try {
    $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create($stream,
        [System.Windows.Media.Imaging.BitmapCreateOptions]::None,
        [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
    $src = $decoder.Frames[0]
}
catch {
    Write-Error "Windows could not decode that image: $($_.Exception.Message)"
    exit 1
}
finally {
    $stream.Close()
}

$srcW = $src.PixelWidth
$srcH = $src.PixelHeight

if ($Crop) {
    $rect = New-Object System.Windows.Int32Rect($Crop[0], $Crop[1], $Crop[2], $Crop[3])
    $src = New-Object System.Windows.Media.Imaging.CroppedBitmap($src, $rect)
}

# Only ever shrink. Scaling a small photo up just adds bytes.
$scale = [Math]::Min(1.0, $MaxEdge / [Math]::Max($src.PixelWidth, $src.PixelHeight))
$outW = [int][Math]::Round($src.PixelWidth * $scale)
$outH = [int][Math]::Round($src.PixelHeight * $scale)

$visual = New-Object System.Windows.Media.DrawingVisual
[System.Windows.Media.RenderOptions]::SetBitmapScalingMode($visual,
    [System.Windows.Media.BitmapScalingMode]::HighQuality)
$ctx = $visual.RenderOpen()
$ctx.DrawImage($src, (New-Object System.Windows.Rect(0, 0, $outW, $outH)))
$ctx.Close()

$rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($outW, $outH, 96, 96,
    [System.Windows.Media.PixelFormats]::Pbgra32)
$rtb.Render($visual)

$encoder = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
$encoder.QualityLevel = $Quality
$encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$fs = [System.IO.File]::Create($dst)
$encoder.Save($fs)
$fs.Close()

$before = [Math]::Round((Get-Item -LiteralPath $In).Length / 1KB, 1)
$after = [Math]::Round((Get-Item -LiteralPath $dst).Length / 1KB, 1)

Write-Host ""
Write-Host "  wrote images/$slug.jpg" -ForegroundColor Green
Write-Host "  $srcW x $srcH, $before KB  ->  $outW x $outH, $after KB"
Write-Host ""
Write-Host "  Paste this into index.html, inside the album-track div:" -ForegroundColor Cyan
Write-Host ""

$cap = if ($Caption) { $Caption } else { $slug }

@"
<figure class="album-slide">
	<div class="album-shot">
		<img class="album-blur" src="images/$slug.jpg" alt="" aria-hidden="true" loading="lazy" />
		<img
			class="album-img"
			src="images/$slug.jpg"
			alt="$cap"
			width="$outW"
			height="$outH"
			loading="lazy"
			decoding="async"
			onerror="var f=this.closest('.album-slide'); if (f) f.hidden = true;"
		/>
	</div>
	<figcaption class="album-cap">
		<span class="album-file">$slug.jpg</span>
		<span class="album-note">$cap</span>
	</figcaption>
</figure>
"@

Write-Host ""
Write-Host "  Then bump the ?v= number on style.css and site.js in index.html." -ForegroundColor DarkGray
Write-Host ""
