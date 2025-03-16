## Video generation from text

TBD
Sora not recomended something production ready

[AI-BOT] - Failed
this requires more power and lots of docs reading
Needs more power or SORA
```
1. Core Issue Identification:

    The current VideoGeneratorPipeline is a synthetic implementation without actual diffusion model components

    Missing proper text conditioning and temporal modeling

    No actual Sora model weights being loaded

2. Working Solution Using Alternative Approach (until Open-Sora is properly released):
```

- https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt USED
stabilityai/stable-diffusion-2-1 - bump down because cuda was running out of mem
CompVis/stable-diffusion-v1-4  -- bump down
Using SD v1.5 bump down
see latest version of diffusion-generaton.py had some decent results
sora-req.txt needed - if using sora
