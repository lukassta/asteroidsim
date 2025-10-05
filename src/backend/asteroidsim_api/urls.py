from django.contrib import admin
from django.urls import path

from asteroid import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/asteroid/",
        views.AsteroidListView.as_view(),
        name="asteroid_list_view",
    ),
    path(
        "api/simulations/",
        views.SimulationsComputeView.as_view(),
        name="simulations_compute_view",
    ),
    path(
        "api/simulations/<int:simulation_id>/",
        views.SimulationsFetchView.as_view(),
        name="simulations_fetch_view",
    ),
    path(
        "api/neo-id/",
        views.NeoIdView.as_view(),
        name="neo_id_view",
    ),
]
