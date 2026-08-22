# todo-app

The todo app from the Kipper video series, with one feature built per episode.
Every episode is tagged, so you can start anywhere.

Right now it's a small Node service that keeps the list in Postgres, so a todo
survives a reload. Everyone who opens the page shares the one list. Episode
three signs you in without a password.

## Episode 1: from GitHub to a live URL

Everything the episode runs, in order, so you can follow along without pausing
the video. You need a server you can SSH into, running Ubuntu or Debian.

Two paths through the same steps. The video hands the prompts to Claude Code;
the commands underneath are what that produces, so use whichever you prefer.

### 1. Teach Claude the CLI

```bash
curl -sL --create-dirs https://raw.githubusercontent.com/getkipper/kipper/main/skills/kipper/SKILL.md -o ~/.claude/skills/kipper/SKILL.md
```

Restart the session afterwards so it loads. Without this your agent has never
heard of `kip` and will invent flags. Codex reads the same file through a line in
`AGENTS.md`.

Skip this step if you're running the commands yourself.

### 2. An SSH key, if you need one

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_kipper -C "kipper"
```

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_kipper.pub root@<your-server>
```

The second asks for the root password your provider emailed you. If you picked a
key when you created the server, it's already there and you can skip both.

Pass the path with `-f` rather than typing it when `ssh-keygen` asks. It doesn't
expand `~`, so a tilde typed at the prompt creates a directory called `~` and
fails.

### 3. Install the cluster

Ask for it:

```text
Install a Kipper cluster on <your-server>. The SSH key is at
~/.ssh/id_ed25519_kipper and the admin address is you@example.com. Skip the
inline browser login. Then stop and tell me what to do next.
```

Or run it:

```bash
curl -sL https://getkipper.com/install | sh
```

```bash
kip install --host <your-server> --admin-email you@example.com
```

Either way your cluster gets a free name derived from your server's address, like
`203-0-113-10.kipper.run`, with HTTPS issued automatically. The installer prints
it when it finishes, and everything below hangs off it.

The prompt tells the agent to skip the inline sign-in, because it can't complete
a browser login. That's the only reason, and it's why step 4 exists. Run the
install yourself and the browser opens at the end, you sign in there, and step 4
doesn't apply to you.

**If you're following the video, it runs a longer command than either of these.**
It passes `--domain lab.kipper.run` to keep the presenter's server address out of
a video that stays up. You need none of that, and the name is taken, so don't
copy it. Leave `--domain` off and take the free one.

### 4. Sign in

Only if you used the prompt in step 3. If you ran the install yourself, you
already signed in when the browser opened.

```bash
kip auth login
```

```bash
kip auth verify
```

A default install leaves your machine with a kubeconfig carrying no credential of
its own, and `kip app rebuild` goes through the console API with a token from
that sign-in. It's the one step an agent can't do for you, which is the point at
which it hands the browser back.

### 5. Deploy this repo

Ask for it:

```text
The repo https://github.com/getkipper/todo-app serves static HTML on port 80.
Deploy it to the cluster as an app called todo-app and trigger the first build.
```

Or run it:

```bash
kip app deploy --name todo-app --git https://github.com/getkipper/todo-app.git --port 80
```

```bash
kip app rebuild todo-app
```

`deploy` registers the app and stores the git source. It doesn't build. `rebuild`
starts the build, which clones the repo, builds the Dockerfile with Kaniko and
pushes the image to the registry running on your own cluster. No registry account
anywhere in this.

### 6. Watch it build

```bash
kip app build-logs todo-app
```

### 7. Open it

```text
https://todo-app--<your-cluster-domain>
```

The certificate is already issued, so click the padlock. Nobody configured
cert-manager.

The console is at `https://console--<your-cluster-domain>`, and the app you made
from the CLI is already in it.

## Episode 2: give it a database

Starts where episode 1 ended: the cluster is up, you're signed in, and
`todo-app` is live. The app grew a backend this episode, an Express server that
keeps the list in Postgres and reads the connection from environment variables.

Ask for it:

```text
Add a Postgres database called db to the cluster and bind it to todo-app, then
rebuild todo-app so it runs the new backend.
```

Or run it:

```bash
kip service add postgres --name db
```

```bash
kip service bind db todo-app
```

```bash
kip app rebuild todo-app
```

`service add` runs a Postgres on your cluster. `bind` creates a database for
the app inside it and injects `DB_HOST`, `DB_PORT`, `DB_USERNAME`,
`DB_PASSWORD` and `DB_NAME` into the app's environment, restarting the app so
it picks them up. Nobody wrote a connection string. `rebuild` builds the new
backend from this repo, exactly like episode 1.

Open the app, add a todo, refresh. It's still there.

## Following along

| Tag | Episode |
| --- | --- |
| `ep-1` | From GitHub to a live URL |
| `ep-2` | Give it a database |

## What this is

Series material rather than a starting template. It's shaped to teach one Kipper
feature at a time, so it makes choices a production app wouldn't. Take whatever
is useful.

Kipper itself: [getkipper.com](https://getkipper.com) ·
[docs](https://docs.getkipper.com) ·
[source](https://github.com/getkipper/kipper)

MIT licensed.
