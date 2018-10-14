'use strict';

import * as vscode from 'vscode';

let globalResourceToCompare: vscode.Uri;

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(

    vscode.commands.registerCommand('diffexplorer.compareSource', (uri: vscode.Uri) => {

      globalResourceToCompare = uri;

      vscode.commands.executeCommand('setContext', 'folderSelected', true);

    }),

    vscode.commands.registerCommand('diffexplorer.compareWithSelected', (uri: vscode.Uri) => {
      vscode.commands.executeCommand('setContext', 'folderSelected', false);

      console.log("Compare " + globalResourceToCompare.toString() + " with " + uri.toString());

    })

  );
  
}

// this method is called when your extension is deactivated
export function deactivate() {
}