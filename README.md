# PixelPress - Image Compression Tool

A powerful desktop application for batch image compression and format conversion built with Electron, Node.js, and Sharp.

![PixelPress Screenshot](assets/icon.png)

## ✨ Features

- **Batch Processing**: Process entire folders of images recursively
- **Multiple Formats**: Convert to WebP, AVIF, JPEG, or PNG
- **Smart Compression**: Automatically compress images to meet size requirements
- **Folder Structure**: Maintains original folder hierarchy in output
- **Progress Tracking**: Real-time progress updates with file names
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Modern UI**: Clean, intuitive interface with drag-and-drop feel

## 🚀 Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pixelpress.git
cd pixelpress
```

2. Install dependencies:

```bash
npm install
```

3. Run the application:

```bash
npm start
```

## 📖 Usage

1. **Select Source Folder**: Click "Browse" next to "Source Folder" and choose the folder containing your images
2. **Select Destination Folder**: Click "Browse" next to "Destination Folder" and choose where to save processed images
3. **Choose Target Format**: Select your desired output format from the dropdown:
   - **WebP** (.webp) - Best compression, modern browsers
   - **AVIF** (.avif) - Next-gen format, excellent compression
   - **JPEG** (.jpeg) - Universal compatibility
   - **PNG** (.png) - Lossless compression
4. **Set Maximum Size**: Enter the maximum file size in KB (default: 500 KB)
5. **Start Processing**: Click "Start Processing" and watch the progress bar

### Example Workflow

```
Source: C:\Users\Pictures\Photos
Destination: C:\Users\Pictures\Compressed
Format: WebP
Max Size: 300 KB

Result: All images converted to WebP format under 300 KB
```

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

This opens the application with developer tools enabled.

### Project Structure

```
pixelpress/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── index.html           # User interface
├── renderer.js          # UI logic and event handling
├── imageProcessor.js    # Image processing with Sharp
├── package.json         # Dependencies and build config
├── assets/              # Application icons
└── README.md           # This file
```

### Key Technologies

- **Electron**: Desktop application framework
- **Sharp**: High-performance image processing
- **Node.js**: Backend runtime
- **HTML/CSS/JS**: Modern web technologies for UI

## 📦 Building for Distribution

### Build for All Platforms

```bash
npm run build
```

### Platform-Specific Builds

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Built applications will be available in the `dist/` folder.

### Build Requirements

- **Windows**: No additional requirements
- **macOS**: Requires macOS to build .dmg files
- **Linux**: Works on any platform for AppImage

## 🎯 Supported Image Formats

### Input Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- AVIF (.avif)
- TIFF (.tiff, .tif)
- BMP (.bmp)
- GIF (.gif)

### Output Formats

- WebP (.webp) - Recommended for web
- AVIF (.avif) - Next-generation format
- JPEG (.jpeg) - Universal compatibility
- PNG (.png) - Lossless compression

## ⚙️ Configuration

### Default Settings

- **Target Format**: WebP
- **Maximum Size**: 500 KB
- **Quality Range**: 90-10 (auto-adjusted)
- **Resize Strategy**: Proportional scaling when needed

### Compression Algorithm

1. Start with 90% quality
2. Reduce quality in steps if file too large
3. Resize image dimensions if quality reduction insufficient
4. Maintain aspect ratio throughout process

## 🔧 Troubleshooting

### Common Issues

**"No supported image files found"**

- Ensure your source folder contains supported image formats
- Check that you have read permissions for the source folder

**"Source or destination folder does not exist"**

- Verify both folders exist and are accessible
- Ensure you have write permissions for the destination folder

**Processing fails on specific images**

- Some corrupted images may be skipped automatically
- Check the console for detailed error messages

**Application won't start**

- Ensure Node.js 16+ is installed
- Run `npm install` to install dependencies
- Try `npm run dev` for debugging information

### Performance Tips

- **Large batches**: Process in smaller batches for better responsiveness
- **SSD storage**: Use SSD drives for faster processing
- **Memory**: Ensure sufficient RAM for large images
- **Format choice**: WebP offers best compression/quality balance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

### Development Guidelines

- Follow existing code style and formatting
- Add comments for complex logic
- Test on multiple platforms when possible
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) - Amazing image processing library
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [Node.js](https://nodejs.org/) - JavaScript runtime

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/pixelpress/issues) page
2. Create a new issue with detailed information
3. Include your OS, Node.js version, and error messages

---

**Made with ❤️ for efficient image processing**
