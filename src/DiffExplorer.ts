'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

let compareSync = require('dir-compare').compareSync;

export interface IDiffNode {
  label: string;
  parent: string | null;

  uri1?: vscode.Uri;
  uri2?: vscode.Uri;

  state?: string;
  type?: string;

  nodes: IDiffNode[];
}

class DiffNode implements IDiffNode {

  constructor(private _root: DiffRoot, private _diff: any) { }

  public get label() { return this._diff.name1 ? this._diff.name1 : this._diff.name2; }
  public get parent() { return this._diff.relativePath; }

  public get uri1() {
    if (this._diff.state == 'right') {
      return;
    }
    const path1 = path.join(this._diff.path1, this._diff.name1);
    return vscode.Uri.file(path1);
  }

  public get uri2() {
    if (this._diff.state == 'left') {
      return;
    }
    const path2 = path.join(this._diff.path2, this._diff.name2);
    return vscode.Uri.file(path2);
  }

  public get state() { return this._diff.state; }

  public get type() {
    if (this._diff.state == 'left') {
      return this._diff.type1;
    } else {
      return this._diff.type2;
    }
  }

  public get nodes() {
    return this._root.getChildren(this.parent + '/' + this.label);
  }
}

class DiffRoot implements IDiffNode {

  private diffSet: Array<any>;

  constructor(private _uri1: vscode.Uri, private _uri2: vscode.Uri) {
    const options = { compareContent: true };
    const res = compareSync(this._uri1.fsPath, this._uri2.fsPath, options);

    this.diffSet = res.diffSet;
  }

  public get label() {
    return path.basename(this._uri1.fsPath) + '<>' + path.basename(this._uri2.fsPath);
  }

  public get parent() { return null; }

  public get nodes() {
    return this.getChildren('') as IDiffNode[];
  }

  public getChildren(path: string): DiffNode[] {
    if (this.diffSet) {
      const children = this.diffSet.filter(d => d.relativePath == path);
      return children.map(d => { return new DiffNode(this, d) });
    }
    return [];
  }
}

export class DiffTreeDataProvider implements vscode.TreeDataProvider<IDiffNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

  private roots: DiffRoot[];

  constructor() {
    this.roots = [];
  }

  public openDiff(uri1: vscode.Uri, uri2: vscode.Uri) {
    this.roots.push(new DiffRoot(uri1, uri2));
    this._onDidChangeTreeData.fire();
  }

  public clear() {
    this.roots = []; //dispose
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IDiffNode): vscode.TreeItem {
    const isFile = this.getType(element) === 'file';
    let command = undefined;
    if (isFile) {
      if (element.uri1 != undefined && element.uri2 != undefined) {
        command = {
          command: 'vscode.diff',
          arguments: [element.uri1, element.uri2],
          title: 'Open diff'
        }
      } else if (element.uri1) {
        command = {
          command: 'vscode.open',
          arguments: [element.uri1],
          title: 'Open left'
        }
      } else {
        command = {
          command: 'vscode.open',
          arguments: [element.uri2],
          title: 'Open right'
        }
      }
    }
    return {
      label: element.label,
      collapsibleState: isFile ? void 0 : vscode.TreeItemCollapsibleState.Collapsed,
      command: command,
      contextValue: this.getType(element)
    }
  }

  private getType(element: IDiffNode): string {
    if (element.parent === null) {
      return 'root';
    } else if (element.type == 'directory') {
      return 'folder';
    } else {
      return 'file';
    }
  }

  public getChildren(element?: IDiffNode): IDiffNode[] {
    if (!element) {
      return this.roots;
    }
    return element.nodes;
  }

}