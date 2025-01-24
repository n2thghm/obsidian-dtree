import { ItemView, WorkspaceLeaf } from "obsidian";

import Component from "./components/MainComponent.svelte";
import DendronTreePlugin from "./main";
import * as store from "./store";

export const VIEW_TYPE_DENDRON = "dendron-tree-view";

export class DendronView extends ItemView {
  component: Component;

  constructor(leaf: WorkspaceLeaf, private plugin: DendronTreePlugin) {
    super(leaf);
    this.icon = this.plugin.settings.icon
  }

  getViewType() {
    return VIEW_TYPE_DENDRON;
  }

  getDisplayText() {
    return "Dendron Tree";
  }

  async onOpen() {
    store.plugin.set(this.plugin);
    this.component = new Component({
      target: this.contentEl,
    });
  }

  async onClose() {
    this.component.$destroy();
  }
}
