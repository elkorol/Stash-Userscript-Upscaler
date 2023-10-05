# Stash Userscript Performer Image Upscaler

## [INSTALL USERSCRIPT](upscale.user.js?raw=1)

This is a userscript for Stash App, that adds an upscale button on the performer page, that upon clicking allows you to select an appriate upcaling model then upscale and update the image.

It uses [UpscalerJS](https://github.com/thekevinscott/UpscalerJS)

Upon upscaling please be patient if upscaling an already large image, it may freeze or crash.

## Prequisites

Stash updated it's security policy so it doesn't work anymore with require lines in the userscript from an external source to the model files. You need to host them yourself using the Custom Served Folders feature in Stash.

Copy the repository with

```yaml
git clone https://github.com/elkorol/Stash-Userscript-Upscaler.git
```

I've included the model files in this repo for you to use, otherwise you can install the most up to date versions with NPM. I.e.

npm install @upscalerjs/esrgan-slim
npm install @upscalerjs/esrgan-medium
npm install @upscalerjs/esrgan-thick

### Example *Add this to config.yml*

```yaml
custom_served_folders:
  /models: {Including drive letter, Path to Stash installation}\custom\models
```

*I.E.*

```yaml
custom_served_folders:
  /models: B:\Stash\custom\models
```

## Usage

Open and copy or load the Javascript into your favourite Userscript Manager, like Tampermonkey or Violent Monkey and change @match to point to the URL of your Stash configuration.

![Upscaler 1](https://github.com/elkorol/Stash-Userscript-Upscaler/blob/e4776a9a0a6a3746975c528e9375811aac236c1a/images/1.png)

![Upscaler 2](https://github.com/elkorol/Stash-Userscript-Upscaler/blob/e4776a9a0a6a3746975c528e9375811aac236c1a/images/2.png)

![Upscaler 3](https://github.com/elkorol/Stash-Userscript-Upscaler/blob/e4776a9a0a6a3746975c528e9375811aac236c1a/images/3.png)
