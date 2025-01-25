import { App, ButtonComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import DendronTreePlugin from "./main";
import { VaultConfig } from "./engine/vault";
import { AddVaultModal } from "./modal/add-vault";
import { attachIconMenu, dendronActivityBarName } from "./icons";
import { VIEW_TYPE_DENDRON } from "./view";

export interface DendronTreePluginSettings {
  /**
   * @deprecated use vaultList
   */
  vaultPath?: string;
  vaultList: VaultConfig[];
  autoGenerateFrontmatter: boolean;
  autoReveal: boolean;
  customResolver: boolean;
  customGraph: boolean;
  deleteMethod: string;
  icon: string;
}

export const DEFAULT_SETTINGS: DendronTreePluginSettings = {
  vaultList: [
    {
      name: "root",
      path: "/",
    },
  ],
  autoGenerateFrontmatter: true,
  autoReveal: true,
  customResolver: false,
  customGraph: false,
  deleteMethod: "moveToTrash",
  icon: dendronActivityBarName
};

export class DendronTreeSettingTab extends PluginSettingTab {
  plugin: DendronTreePlugin;
  iconSetButton: ButtonComponent;

  constructor(app: App, plugin: DendronTreePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Dendron Tree Settting" });
    
    new Setting(containerEl)
      .setName('Icon')
      .setDesc('Modify the plugin icon.')
      // .addText( (text) => text
      //   .setPlaceholder(dendronActivityBarName)
      //   .setValue(this.plugin.settings.icon)
      //   .onChange(async (value) => {
      //     this.plugin.settings.icon = value;
      //     await this.plugin.saveSettings();
      //   })
      // )
      .addExtraButton(button => button
        .setIcon(this.plugin.settings.icon)
        .setTooltip(this.plugin.settings.icon)
      )
      .addButton( button => {
        this.iconSetButton = button
        button
        .setButtonText('Set Icon')
        .onClick(() => attachIconMenu(button, iconId => {
            saveIconParam(iconId, this)
          })
        )
      })
      
    
    new Setting(containerEl)
    .setName("Deletion Method")
    .setDesc(
      "What happens when you delete a file"
    )
    .addDropdown(dropdown => dropdown
      .addOption('moveToTrash', 'Move to Trash')
      .addOption('deletePermanently', 'Delete Permanently')
      .setValue(this.plugin.settings.deleteMethod || 'moveToTrash')
      .onChange(async (value) => {
        this.plugin.settings.deleteMethod = value;
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Auto Generate Front Matter")
      .setDesc("Generate front matter for new file even if file is created outside of Dendron tree")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoGenerateFrontmatter).onChange(async (value) => {
          this.plugin.settings.autoGenerateFrontmatter = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Auto Reveal")
      .setDesc("Automatically reveal active file in Dendron Tree")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoReveal).onChange(async (value) => {
          this.plugin.settings.autoReveal = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Custom Resolver")
      .setDesc(
        "Use custom resolver to resolve ref/embed and link. (Please reopen editor after change this setting)"
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.customResolver).onChange(async (value) => {
          this.plugin.settings.customResolver = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Custom Graph Engine")
      .setDesc("Use custom graph engine to render graph (Experimental)")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.customGraph).onChange(async (value) => {
          this.plugin.settings.customGraph = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl).setName("Vault List").setHeading();
    for (const vault of this.plugin.settings.vaultList) {
      new Setting(containerEl)
        .setName(vault.name)
        .setDesc(`Folder: ${vault.path}`)
        .addButton((btn) => {
          btn.setButtonText("Remove").onClick(async () => {
            this.plugin.settings.vaultList.remove(vault);
            await this.plugin.saveSettings();
            this.display();
          });
        });
    }
    new Setting(containerEl).addButton((btn) => {
      btn.setButtonText("Add Vault").onClick(() => {
        new AddVaultModal(this.app, (config) => {
          const list = this.plugin.settings.vaultList;
          const nameLowecase = config.name.toLowerCase();
          if (list.find(({ name }) => name.toLowerCase() === nameLowecase)) {
            new Notice("Vault with same name already exist");
            return false;
          }
          if (list.find(({ path }) => path === config.path)) {
            new Notice("Vault with same path already exist");
            return false;
          }

          list.push(config);
          this.plugin.saveSettings().then(() => this.display());
          return true;
        }).open();
      });
    });
  }
  hide() {
    super.hide();
    this.plugin.onRootFolderChanged();
    this.plugin.configureCustomResolver();
    this.plugin.configureCustomGraph();
  }
}

function saveIconParam(iconId: string|null, settingTab: DendronTreeSettingTab) {
  settingTab.plugin.settings.icon = iconId != null ? iconId : DEFAULT_SETTINGS.icon
  settingTab.plugin.saveSettings().then(() => {
    settingTab.display()
    updateIconSetButton(settingTab)
    updateViewLeafIcon(settingTab.plugin)
    settingTab.plugin.updateRibbonIcon();
  })

}

function resetIconParam(settingTab: DendronTreeSettingTab) {
  saveIconParam(DEFAULT_SETTINGS.icon, settingTab)
}

function updateIconSetButton(settingTab: DendronTreeSettingTab) {
  if(settingTab.plugin.settings.icon == DEFAULT_SETTINGS.icon) {
    return;
  }

  settingTab.iconSetButton
    .setButtonText('Reset Icon')
    .onClick(() => resetIconParam(settingTab))
}

function updateViewLeafIcon(plugin: DendronTreePlugin) {
  let leaves = app.workspace.getLeavesOfType(VIEW_TYPE_DENDRON)
  if( leaves.length == 0) {
    return;
  }

  let leaf = leaves[0]
  leaf.detach()
  plugin.activateView()
}