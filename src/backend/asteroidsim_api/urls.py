from asteroid import views
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/asteroid/",
        views.AsteroidListView.as_view(),
        name="asteroid_list_view",
    ),
    path(
        "api/simulations/",
        views.SimulationsList.as_view(),
        name="simulations_list_view",
    ),
    path(
        "api/asteroid/<int:volunteering_position_id>/",
        views.SikulationDetailsView.as_view(),
        name="simulation_details_view",
    ),
]
