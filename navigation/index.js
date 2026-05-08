export default [
  {
    "header": "Navigate To",
    "description": "",
    "child": [
      {
        "title": "Dashboard",
        "path": "/dashboard",
        "icon": "ic:outline-dashboard",
        "child": [],
        "meta": {}
      },
      {
        "title": "Bills",
        "path": "/bill",
        "icon": "ph:receipt-duotone",
        "child": [],
        "meta": {}
      },
      {
        "title": "Vouchers",
        "path": "/voucher",
        "icon": "ph:ticket-duotone",
        "child": [],
        "meta": {}
      },
      {
        "title": "Payments",
        "path": "/payment",
        "icon": "ph:wallet-duotone",
        "child": [],
        "meta": {}
      },
      {
        "title": "Summary",
        "path": "/summary",
        "icon": "ph:squares-four-duotone",
        "child": [],
        "meta": {}
      }
    ],
    "meta": {
      "auth": {
        "role": [
          "Staff",
          "User",
        ]
      }
    }
  },
  {
    "header": "Pentadbiran",
    "description": "Urus aplikasi anda",
    "child": [
      {
        "title": "Konfigurasi",
        "icon": "ic:outline-settings",
        "child": [
          {
            "title": "Persekitaran",
            "path": "/devtool/config/environment"
          },
          {
            "title": "Site Settings",
            "path": "/devtool/config/site-settings"
          }
        ]
      },
      {
        "title": "Penyunting Menu",
        "icon": "ci:menu-alt-03",
        "path": "/devtool/menu-editor",
        "child": []
      },
      {
        "title": "Urus Pengguna",
        "path": "/devtool/user-management",
        "icon": "ph:user-circle-gear",
        "child": [
          {
            "title": "Senarai Pengguna",
            "path": "/devtool/user-management/user",
            "icon": "",
            "child": []
          },
          {
            "title": "Senarai Peranan",
            "path": "/devtool/user-management/role",
            "icon": "",
            "child": []
          }
        ]
      },
      {
        "title": "Kandungan",
        "icon": "mdi:pencil-ruler",
        "child": [
          {
            "title": "Penyunting",
            "path": "/devtool/content-editor"
          },
          {
            "title": "Templat",
            "path": "/devtool/content-editor/template"
          }
        ]
      },
      {
        "title": "Penyunting API",
        "path": "/devtool/api-editor",
        "icon": "material-symbols:api-rounded",
        "child": []
      },
      {
        "title": "Panduan Pembangun",
        "path": "/devtool/guide",
        "icon": "material-symbols:menu-book-rounded",
        "child": []
      }
    ],
    "meta": {
      "auth": {
        "role": [
          "Developer"
        ]
      }
    }
  },
  {
    "header": "Navigate To",
    "description": "",
    "child": [
      {
        "title": "Dashboard",
        "path": "/dashboard_admin",
        "icon": "ic:outline-dashboard",
        "child": [],
        "meta": {}
      },
      {
        "title": "Bills",
        "path": "/bill_approval",
        "icon": "ph:receipt-duotone",
        "child": [],
        "meta": {}
      },
      {
        "title": "Vouchers",
        "path": "/voucher_approval",
        "icon": "ph:ticket-duotone",
        "child": [],
        "meta": {}
      }
    ],
    "meta": {
      "auth": {
        "role": [
          "Admin"
        ]
      }
    }
  }
]