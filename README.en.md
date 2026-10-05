[Français](README.md) | **English**

# SOMA — Solar Map

Collaborative mapping of off-grid solar installations in Africa.

Technicians and installers declare the installations they set up or maintain. SOMA aggregates these declarations to make visible an installation base that is largely unrecorded today.

> Status: in development — MVP in progress.

## Why

Off-grid solar installations number in the millions, but their location, capacity and actual condition are poorly known. This data gap holds back public planning, funding allocation and after-sales service.

## Declared data

| Field | Description |
|---|---|
| Location | GPS coordinates (stored, never published at exact address) |
| Capacity | Panel peak power (Wp), battery capacity |
| Type | Solar home kit, productive use, pumping, institutional… |
| Equipment | Brands and models (panels, charge controller, inverter, battery) |
| Condition | Working, faulty, out of service |
| Date | Installation, last intervention |

## What contributors get

- A free register of their installations and intervention history.
- Maintenance reminders.
- Optional visibility on the public map for clients and partners.

## Access

| User | Access | Cost |
|---|---|---|
| Independent technician | Personal register, public map | Free |
| Installation company | Fleet dashboard, multi-technician management | Subscription |
| Manufacturer, distributor | Installation base by equipment and area | Subscription or one-off report |
| Government, funder | Data aggregated by area, electrification reports | Data license |

## Data policy

- **Consent**: each installation is declared with the owner's agreement.
- **Ownership**: each contributor stays in control of their declarations and can export or withdraw them.
- **Neutrality**: no party, including the project's founders, has privileged access to data declared by third parties. One installer's data is never passed on by name to another.
- **Public map**: only data aggregated by area (no exact position, no names).
- **Advanced aggregated data**: paid access, under terms of use separate from the code license.
- **Compliance**: processing in line with personal data regulations in the countries covered.

The AGPL-3.0 license covers the code, not the data. Data is governed by this policy.

## MVP scope

- Mobile declaration form.
- Map based on Google Maps.
- Export of the contributor's own data.

## Repository structure

```
soma/
├── app/            # Declaration form and map
├── api/            # Collection and aggregation
├── data-policy/    # Data policy and access terms
├── docs/
├── README.md
├── README.en.md
├── LICENSE
└── CONTRIBUTING.md
```

## Contributing

Two kinds of contribution: code, and installation declarations. Code contributors sign a Contributor License Agreement (CLA) before their first merge. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Code licensed under [AGPL-3.0](LICENSE). Commercial license available on request. Contact: weareoshu.project@gmail.com.

## Project

Part of [OSHU — Open Solar Hub](https://github.com/oshu-africa).

---

© 2026 ON-Tech. Copyright holder of the code.
