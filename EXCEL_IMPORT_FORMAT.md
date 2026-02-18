# Format Excel Requis pour l'Import OmniLink

## 📋 Structure du fichier

**Première ligne = en-têtes (colonnes)**  
**Autres lignes = données**

---

## ✅ En-têtes de colonnes autorisés

### Colonnes avec variantes reconnues automatiquement :

| Champ BDD | En-têtes Excel acceptés |
|-----------|------------------------|
| **tag** | `tag`, `repere`, `repère`, `instrument`, `point` |
| **service** | `service`, `designation`, `désignation`, `description` |
| **function** | `function`, `fonction`, `type` |
| **sub_function** | `sub_function`, `sous_fonction`, `subfunction` |
| **loc** | `loc`, `location`, `localisation`, `zone` |
| **loop_type** | `loop_type`, `type_boucle`, `looptype`, `boucle` |
| **system** | `system`, `système`, `systeme` |
| **sig** | `sig`, `signal`, `type_signal` |
| **alim** | `alim`, `alimentation` |
| **isolator** | `isolator`, `isolateur`, `isolat` |
| **lightning** | `lightning`, `parafoudre` |
| **io_card_type** | `io_card_type`, `carte`, `card` |
| **io_address** | `io_address`, `adresse`, `address`, `io` |
| **net_type** | `net_type`, `reseau`, `réseau`, `network` |
| **system_cabinet** | `system_cabinet`, `armoire`, `cabinet` |
| **jb_tag** | `jb_tag`, `jb`, `boite`, `boîte`, `junction_box` |
| **jb_dwg** | `jb_dwg`, `plan_jb`, `jb_plan` |
| **obs** | `obs`, `observation`, `commentaire`, `comment`, `remarks`, `note` |

---

## 🎯 Recommandations importantes

### ✨ Meilleure pratique - Utilise ces en-têtes pour 100% de compatibilité :

```
tag | service | function | sub_function | loc | loop_type | system | sig | alim | isolator | lightning | io_card_type | io_address | net_type | system_cabinet | jb_tag | jb_dwg | obs
```

### ⚠️ Points clés

1. **Colonne TAG obligatoire** - Sans elle, la ligne sera ignorée
2. **Pas d'accents** - Préfère `repere` plutôt que `repère` (plus fiable)
3. **Pas d'espaces inutiles** - Les espaces au début/fin posent problème
4. **Casse insensible** - `TAG`, `Tag`, `tag` = pareil
5. **Autres colonnes optionnelles** - Ignore les colonnes non reconnues

---

## 📝 Exemple de fichier valide

| tag | service | function | loc | obs |
|-----|---------|----------|-----|-----|
| PT001 | Instrumentation | Temperature | Zone A | Capteur principal |
| PT002 | Instrumentation | Pressure | Zone B | Capteur secours |
| TI003 | Control | Transmission | Zone C | Signal numrique |

---

## 🔍 Si la détection ne fonctionne pas

1. **Ouvre la console du navigateur** (F12)
2. **Charge ton fichier Excel**
3. **Cherche les logs** = `=== DÉTECTION DES COLONNES ===`
4. Tu verras exactement ce qui est lu et pourquoi ça ne matche pas

