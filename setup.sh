#!/bin/bash
# Projeyi ilk kez klonladıktan sonra bir kere çalıştır

git config pull.rebase true
git config core.hooksPath .githooks
chmod +x .githooks/pre-push

echo "✓ Git hooks kuruldu"
echo "✓ pull.rebase = true ayarlandı"
