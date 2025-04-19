# Fat Log

A simple PWA for logging body weight, fat percentage and waist circumference.

## Development

This code is very out of date and can only be run in node v10. The easiest way
to run it is to use Docker.

```
docker run --rm -it -v "$PWD":/app -w /app node:10 bash
```

In that shell, execute the following commands:

```
yarn
yarn build
```

Then on the host system, with the firebase CLI tools installed, you can run:

```
firebase deploy --only hosting:fatlog
```

> [!WARNING]  
> Firebase has the concepts of sites, channels and targets, it's worth reading
> up on the docs about this and using the `--dry-run` flag on the above command
> to ensure the deployment is happening at the right place as this app does have
> multiple URLs to consider.
