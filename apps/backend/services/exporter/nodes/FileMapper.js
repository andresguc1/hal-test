/**
 * Mapper for file operations.
 * Covers: upload_file, download_file, read_file, write_file
 */
export const FileMapper = {
    type: ['upload_file', 'download_file', 'read_file', 'write_file'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const selector = params.selector || '';
        const filePath = params.filePath || params.path || params.file || 'file.txt';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    upload_file: `await page.setInputFiles(\`${selector}\`, \`${filePath}\`);`,
                    download_file: `const [download] = await Promise.all([\n        page.waitForEvent('download'),\n        page.click(\`${selector || 'a[download]'}\`),\n    ]);\n    await download.saveAs(\`${params.savePath || './downloads/' + filePath}\`);`,
                    read_file: `const fs = require('fs');\nconst fileData = fs.readFileSync(\`${filePath}\`, 'utf-8');`,
                    write_file: `const fs = require('fs');\nfs.writeFileSync(\`${filePath}\`, \`${params.content || params.data || ''}\`);`,
                }[action];

            case 'python':
                return {
                    upload_file: `await page.set_input_files("${selector}", "${filePath}")`,
                    download_file: `async with page.expect_download() as download_info:\n        await page.click("${selector || 'a[download]'}")\n    download = await download_info.value\n    await download.save_as("${params.savePath || './downloads/' + filePath}")`,
                    read_file: `with open("${filePath}", "r") as f:\n        file_data = f.read()`,
                    write_file: `with open("${filePath}", "w") as f:\n        f.write("${params.content || params.data || ''}")`,
                }[action];

            case 'java':
                return {
                    upload_file: `page.setInputFiles("${selector}", Paths.get("${filePath}"));`,
                    download_file: `Download download = page.waitForDownload(() -> {\n            page.click("${selector || 'a[download]'}");\n        });\n        download.saveAs(Paths.get("${params.savePath || './downloads/' + filePath}"));`,
                    read_file: `String fileData = Files.readString(Paths.get("${filePath}"));`,
                    write_file: `Files.writeString(Paths.get("${filePath}"), "${params.content || params.data || ''}");`,
                }[action];

            case 'csharp':
                return {
                    upload_file: `await page.SetInputFilesAsync("${selector}", "${filePath}");`,
                    download_file: `var download = await page.RunAndWaitForDownloadAsync(async () => {\n        await page.ClickAsync("${selector || 'a[download]'}");\n    });\n    await download.SaveAsAsync("${params.savePath || './downloads/' + filePath}");`,
                    read_file: `var fileData = File.ReadAllText("${filePath}");`,
                    write_file: `File.WriteAllText("${filePath}", "${params.content || params.data || ''}");`,
                }[action];

            default:
                return `// file action not implemented for ${lang}`;
        }
    },
};
