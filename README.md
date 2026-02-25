# Genkit documentation website

The [documentation site](https://genkit.dev) for the Genkit framework.

## Issues, bugs, and requests
We welcome contributions and feedback on our website.
Please file a request in our
[issue tracker](https://github.com/genkit-ai/docsite/issues/new/choose)
or create a [pull request](https://github.com/genkit-ai/docsite/pulls).
For simple changes (such as tweaking some text),
it's easiest to make changes using the GitHub UI.

## Before you submit a PR
We love it when the community gets involved in improving our docs!
Here are a few things to keep in mind before you submit a PR. Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

- **Purposeful changes**: Ensure your PR has a clear, singular goal.
- **Clear description**: Describe the problem you are solving and the approach you took in the PR description. 
- **Testing**: Whenever possible, include tests that cover your new code or reproduce the bug you are fixing.

## Contributing
To update this site, fork the repo, make your changes,
and generate a pull request.
For small, contained changes (such as style and typo fixes),
you probably don't need to build this site.
Often you can make changes using the GitHub UI.

If your change involves code samples, adds/removes pages, or affects navigation,
please build and test your work before submitting.

If you want or need to build the site, follow the steps below.

## Build the site
For changes beyond simple text and CSS tweaks,
we recommend running the site locally to
enable an edit-refresh cycle.

### Get the prerequisites
To build and develop the site, you'll need `pnpm`.

Enable `pnpm` if you haven't already, you can learn more [here](https://pnpm.io/).

### Clone this repo
Clone the repository with `git clone`:

```bash
git clone https://github.com/genkit-ai/docsite.git
```

## Set up your local environment and serve changes

1. From the root directory of the repository, install dependencies:

   ```bash
   pnpm install
   ```

2. From the root directory, serve the site locally:

   ```bash
   pnpm dev
   ```

   This command generates and serves the site on a
   local port (usually `localhost:4321`) that's printed to your terminal.

3. View your changes in the browser by navigating to <http://localhost:4321>.

4. Make your changes to the local repo. The site should automatically rebuild on most changes.

5. Build your production site to `./dist/` if needed:

   ```bash
   pnpm build
   ```

6. Commit your changes to the branch and submit your PR.