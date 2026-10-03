#!/usr/bin/env python3
"""Arrow-key menu for the dispatch popups (THV-1077).

  choose.py <title> <items.tsv> <out-file>

items.tsv rows are `value<TAB>label[<TAB>0]`; a trailing 0 shows the row dimmed and unpickable.
Up and down move, Enter picks, typing filters, Backspace edits the filter, Esc cancels. The picked
value goes to <out-file>; exit 1 on cancel. Runs on the terminal: call it with </dev/tty >/dev/tty.
"""
import curses
import sys


def read_key(screen):
    """getch (the macOS python.org curses has no get_wch), with arrows decoded by hand: a terminal
    sends ESC [ B or ESC O B depending on its keypad mode, and a lone ESC means cancel."""
    key = screen.getch()
    if key != 27:
        return key
    screen.nodelay(True)
    try:
        nxt = screen.getch()
        if nxt not in (ord("["), ord("O")):
            return 27
        code = screen.getch()
        if code in (ord("5"), ord("6")):
            screen.getch()  # the trailing ~
            return curses.KEY_PPAGE if code == ord("5") else curses.KEY_NPAGE
        return {ord("A"): curses.KEY_UP, ord("B"): curses.KEY_DOWN}.get(code, -1)
    finally:
        screen.nodelay(False)


def run(screen, title, items):
    curses.curs_set(0)
    screen.keypad(False)  # read_key decodes arrows itself
    try:
        curses.use_default_colors()
    except curses.error:
        pass
    query, pos, top = "", 0, 0
    while True:
        shown = [it for it in items if query.lower() in (it[0] + " " + it[1]).lower()]
        pos = max(0, min(pos, len(shown) - 1))
        h, w = screen.getmaxyx()
        rows = max(1, h - 4)
        top = min(max(top, pos - rows + 1), pos)
        screen.erase()
        screen.addnstr(0, 1, title, w - 2, curses.A_BOLD)
        screen.addnstr(1, 1, f"filter: {query}" if query else "type to filter, arrows to move, Enter to pick, Esc to cancel", w - 2, curses.A_DIM)
        for i, (value, label, ok) in enumerate(shown[top : top + rows]):
            attr = curses.A_REVERSE if top + i == pos else 0
            if not ok:
                attr |= curses.A_DIM
            screen.addnstr(3 + i, 1, ("> " if top + i == pos else "  ") + label, w - 2, attr)
        if not shown:
            screen.addnstr(3, 3, "nothing matches", w - 4, curses.A_DIM)
        screen.refresh()
        key = read_key(screen)
        if key in (27, 3):
            return None
        if key in (curses.KEY_UP, 16):
            pos -= 1
        elif key in (curses.KEY_DOWN, 14):
            pos += 1
        elif key == curses.KEY_PPAGE:
            pos -= rows
        elif key == curses.KEY_NPAGE:
            pos += rows
        elif key in (10, 13, curses.KEY_ENTER):
            if shown and shown[pos][2]:
                return shown[pos][0]
        elif key in (curses.KEY_BACKSPACE, 127, 8):
            query, pos = query[:-1], 0
        elif 32 <= key < 127:
            query, pos = query + chr(key), 0


def main():
    title, items_path, out_path = sys.argv[1:4]
    items = []
    for line in open(items_path, encoding="utf-8"):
        cells = line.rstrip("\n").split("\t")
        if cells and cells[0]:
            items.append((cells[0], cells[1] if len(cells) > 1 else cells[0], not (len(cells) > 2 and cells[2] == "0")))
    picked = curses.wrapper(run, title, items)
    if picked is None:
        sys.exit(1)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(picked)


if __name__ == "__main__":
    main()
